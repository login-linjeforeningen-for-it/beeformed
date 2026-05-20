import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import type { IdParams } from '#schemas.ts'
import config from '#constants'
import { runInTransaction, HttpError } from '#db'
import { loadSQL } from '#utils/db/sql.ts'
import { sendTypedEmail } from '#utils/email/sendSMTP.ts'
import { logError } from '#utils/logger.ts'

const getSql = await loadSQL('submissions/selectForDeletion.sql')
const formLockSql = await loadSQL('forms/selectLimitForUpdate.sql')
const updateStatusSql = await loadSQL('submissions/updateStatus.sql')
const countSql = await loadSQL('submissions/countRegistered.sql')
const waitlistSql = await loadSQL('submissions/selectWaitlistBatch.sql')

export default async function deleteSubmission(
    req: AuthenticatedRequest<{ Params: IdParams }>,
    res: FastifyReply
) {
    const user = req.user

    const result = await runInTransaction(async (client) => {
        const getResult = await client.query(getSql, [req.params.id])
        if (getResult.rows.length === 0) throw new HttpError(404, 'Submission not found')

        const submission = getResult.rows[0]
        if (submission.user_id !== user.id && submission.form_owner_id !== user.id) {
            throw new HttpError(403, 'You do not have permission to delete this submission')
        }
        if (new Date() > new Date(submission.expires_at)) {
            throw new HttpError(400, 'Cannot remove submission after form has closed')
        }

        const newStatus: 'cancelled' | 'rejected' = submission.user_id === user.id ? 'cancelled' : 'rejected'
        await client.query(updateStatusSql, [req.params.id, newStatus])

        const formLockResult = await client.query(formLockSql, [submission.form_id])
        const currentLimit = formLockResult.rows[0]?.limit ?? null

        let promoted: { id: string; email: string | null } | null = null
        if (submission.status === 'registered' && currentLimit !== null) {
            const countResult = await client.query(countSql, [submission.form_id])
            const registeredCount = Number(countResult.rows[0].count)

            if (registeredCount < currentLimit) {
                const nextResult = await client.query(waitlistSql, [submission.form_id, 1])
                if (nextResult.rows.length > 0) {
                    const nextPerson = nextResult.rows[0] as { id: string; email: string | null }
                    promoted = nextPerson
                    await client.query(updateStatusSql, [nextPerson.id, 'registered'])
                }
            }
        }

        return { submission, promoted, newStatus }
    })

    const { submission, promoted, newStatus } = result

    if (submission.user_email) {
        try {
            await sendTypedEmail('submission', submission.user_email, {
                title: submission.form_title,
                status: newStatus,
                ownerEmail: submission.form_owner_email,
                actionUrl: `${config.FRONTEND_URL}/f/${submission.form_slug}`,
                actionText: 'View Form',
                submissionId: submission.id
            })
        } catch (emailError) {
            logError('Failed to send cancellation email', {
                event: 'submission.cancellation_email_failed',
                submissionId: submission.id,
                error: emailError
            })
        }
    }

    if (promoted?.email) {
        try {
            await sendTypedEmail('submission', promoted.email, {
                title: submission.form_title,
                status: 'bumped',
                ownerEmail: submission.form_owner_email,
                actionUrl: `${config.FRONTEND_URL}/submissions/${promoted.id}`,
                actionText: 'View Submission',
                submissionId: promoted.id
            })
        } catch (emailError) {
            logError('Failed to send promotion email', {
                event: 'submission.promotion_email_failed',
                submissionId: promoted.id,
                error: emailError
            })
        }
    }

    return res.status(204).send()
}
