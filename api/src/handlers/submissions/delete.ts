import config from '#constants'
import { runInTransaction } from '#db'
import { loadSQL } from '#utils/sql.ts'
import { sendTemplatedMail } from '#utils/email/sendSMTP.ts'
import { sendInternalServerError } from '#utils/http/errors.ts'
import type { AuthRequest } from '#utils/auth/authMiddleware.ts'

export default async function deleteSubmission(req: AuthRequest) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params = (req as any).params
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = req.user as any

    try {
        const result = await runInTransaction(async (client) => {
            const getSql = await loadSQL('submissions/getForDeletion.sql')
            const getResult = await client.query(getSql, [params.id])

            if (getResult.rows.length === 0) {
                const error = new Error('Submission not found')
                ;(error as Error & { statusCode?: number }).statusCode = 404
                throw error
            }

            const submission = getResult.rows[0]

            if (submission.user_id !== user.id && submission.form_owner_id !== user.id) {
                const error = new Error('You do not have permission to delete this submission')
                ;(error as Error & { statusCode?: number }).statusCode = 403
                throw error
            }

            const now = new Date()
            const expiresAt = new Date(submission.expires_at)
            if (now > expiresAt) {
                const error = new Error('Cannot remove submission after form has closed')
                ;(error as Error & { statusCode?: number }).statusCode = 400
                throw error
            }

            const updateStatusSql = await loadSQL('submissions/updateStatus.sql')
            await client.query(updateStatusSql, [params.id, 'cancelled'])

            let promoted: { id: string; email: string | null } | null = null
            if (submission.status === 'registered' && submission.limit !== null) {
                const countSql = await loadSQL('submissions/countRegistered.sql')
                const countResult = await client.query(countSql, [submission.form_id])
                const registeredCount = Number(countResult.rows[0].count)

                if (registeredCount < submission.limit) {
                    const nextWaitlistedResult = await client.query(
                        `SELECT s.id, u.email
                         FROM submissions s
                         JOIN users u ON s.user_id = u.user_id
                         WHERE s.form_id = $1 AND s.status = 'waitlisted'
                         ORDER BY s.submitted_at ASC
                         LIMIT 1
                         FOR UPDATE SKIP LOCKED`,
                        [submission.form_id]
                    )

                    if (nextWaitlistedResult.rows.length > 0) {
                        const nextPerson = nextWaitlistedResult.rows[0] as { id: string; email: string | null }
                        promoted = nextPerson
                        await client.query(updateStatusSql, [nextPerson.id, 'registered'])
                    }
                }
            }

            return { submission, promoted }
        })

        const { submission, promoted } = result

        if (submission.user_email) {
            const isOwner = submission.user_id === user.id
            await sendTemplatedMail(submission.user_email, {
                title: submission.form_title,
                status: isOwner ? 'cancelled' : 'rejected',
                ownerEmail: submission.form_owner_email,
                actionUrl: `${config.FRONTEND_URL}/f/${submission.form_slug}`,
                actionText: 'View Form',
                submissionId: submission.id
            })
        }

        if (promoted?.email) {
            await sendTemplatedMail(promoted.email, {
                title: submission.form_title,
                status: 'bumped',
                ownerEmail: submission.form_owner_email,
                actionUrl: `${config.FRONTEND_URL}/submissions/${promoted.id}`,
                actionText: 'View Submission',
                submissionId: promoted.id
            })
        }

        return Response.json({ success: true, message: 'Submission cancelled' })
    } catch (error: unknown) {
        const statusCode = (error as Error & { statusCode?: number }).statusCode
        if (statusCode) {
            return Response.json({ error: (error as Error).message }, { status: statusCode })
        }
        return sendInternalServerError('Error deleting submission:', error)
    }
}
