import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { sendTemplatedMail } from '#utils/email/sendSMTP.ts'
import { sendInternalServerError } from '#utils/http/errors.ts'

export default async function deleteSubmission(req: FastifyRequest, res: FastifyReply) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params = req.params as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = req.user as any

    try {
        const getSql = await loadSQL('submissions/getForDeletion.sql')
        const getResult = await run(getSql, [params.id])

        if (getResult.rows.length === 0) {
            return res.status(404).send({ error: 'Submission not found' })
        }

        const submission = getResult.rows[0]

        if (submission.user_id !== user.id && submission.form_owner_id !== user.id) {
             return res.status(403).send({ error: 'You do not have permission to delete this submission' })
        }

        const now = new Date()
        const expiresAt = new Date(submission.expires_at)
        if (now > expiresAt) {
             return res.status(400).send({ error: 'Cannot remove submission after form has closed' })
        }

        const updateStatusSql = await loadSQL('submissions/updateStatus.sql')
        await run(updateStatusSql, [params.id, 'cancelled'])

        if (submission.user_email) {
            const isOwner = submission.user_id === user.id
            await sendTemplatedMail(submission.user_email, {
                title: submission.form_title,
                status: isOwner ? 'cancelled' : 'rejected',
                ownerEmail: submission.form_owner_email,
                actionUrl: `${req.server.appConfig.FRONTEND_URL}/f/${submission.form_slug}`,
                actionText: 'View Form',
                submissionId: submission.id
            })
        }

        if (submission.status === 'registered' && submission.limit !== null) {
            const countSql = await loadSQL('submissions/countRegistered.sql')
            const countResult = await run(countSql, [submission.form_id])
            const registeredCount = countResult.rows[0].count

            if (registeredCount < submission.limit) {
                const getWaitlistSql = await loadSQL('submissions/getWaitlistBatch.sql')
                const updateStatusSql = await loadSQL('submissions/updateStatus.sql')
                
                const waitlistResult = await run(getWaitlistSql, [submission.form_id, 1])
                
                if (waitlistResult.rows.length > 0) {
                    const nextPerson = waitlistResult.rows[0]
                    await run(updateStatusSql, [nextPerson.id, 'registered'])
                    
                    if (nextPerson.email) {
                        await sendTemplatedMail(nextPerson.email, {
                            title: submission.form_title,
                            status: 'bumped',
                            ownerEmail: submission.form_owner_email,
                            actionUrl: `${req.server.appConfig.FRONTEND_URL}/submissions/${nextPerson.id}`,
                            actionText: 'View Submission',
                            submissionId: nextPerson.id
                        })
                    }
                }
            }
        }

        const updateSql = await loadSQL('submissions/updateStatus.sql')
        await run(updateSql, [params.id, 'cancelled'])

        res.send({ success: true, message: 'Submission cancelled' })

    } catch (error) {
        return sendInternalServerError(res, 'Error deleting submission:', error)
    }
}
