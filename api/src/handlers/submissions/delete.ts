import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import config from '#constants'
import { runInTransaction } from '#db'
import { loadSQL } from '#utils/sql.ts'
import { sendTypedEmail } from '#utils/email/sendSMTP.ts'
import { logError } from '#utils/logger.ts'

export default async function deleteSubmission(
    req: AuthenticatedRequest<{ Params: IdParams }>,
    res: FastifyReply
) {
    const submissionId = req.params.id
    const user = req.user

    try {
        const result = await runInTransaction(async (client) => {
            const getSql = await loadSQL('submissions/selectForDeletion.sql')
            const getResult = await client.query(getSql, [submissionId])

            if (getResult.rows.length === 0) {
                throw Object.assign(new Error('Submission not found'), { statusCode: 404 })
            }

            const submission = getResult.rows[0]

            if (submission.user_id !== user.id && submission.form_owner_id !== user.id) {
                throw Object.assign(new Error('You do not have permission to delete this submission'), { statusCode: 403 })
            }

            const now = new Date()
            const expiresAt = new Date(submission.expires_at)
            if (now > expiresAt) {
                throw Object.assign(new Error('Cannot remove submission after form has closed'), { statusCode: 400 })
            }

            const updateStatusSql = await loadSQL('submissions/updateStatus.sql')
            const newStatus = submission.user_id === user.id ? 'cancelled' : 'rejected'
            await client.query(updateStatusSql, [submissionId, newStatus])

            // Lock the form row to serialize concurrent deletions that would both try to promote from the waitlist
            await client.query('SELECT id FROM forms WHERE id = $1 FOR UPDATE', [submission.form_id])

            let promoted: { id: string; email: string | null } | null = null
            if (submission.status === 'registered' && submission.limit !== null) {
                const countSql = await loadSQL('submissions/countRegistered.sql')
                const countResult = await client.query(countSql, [submission.form_id])
                const registeredCount = Number(countResult.rows[0].count)

                if (registeredCount < submission.limit) {
                    const getWaitlistSql = await loadSQL('submissions/selectWaitlistBatch.sql')
                    const nextWaitlistedResult = await client.query(getWaitlistSql, [submission.form_id, 1])

                    if (nextWaitlistedResult.rows.length > 0) {
                        const nextPerson = nextWaitlistedResult.rows[0] as { id: string; email: string | null }
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
    } catch (error: unknown) {
        const statusCode = (error as Error & { statusCode?: number }).statusCode
        if (statusCode) {
            return res.status(statusCode).send({ error: (error as Error).message })
        }
        logError('Error deleting submission', {
            event: 'http.internal_error',
            requestId: req.id,
            error
        })
        return res.status(500).send({ error: 'Internal server error' })
    }
}
