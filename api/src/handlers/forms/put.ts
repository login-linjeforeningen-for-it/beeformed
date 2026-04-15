import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { sendTemplatedMail } from '#utils/email/sendSMTP.ts'
import { sendInternalServerError } from '#utils/http/errors.ts'
import { isValidSlug, validatePublicationWindow } from '#utils/validation/validators.ts'

export default async function updateForm(req: FastifyRequest, res: FastifyReply) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = req.body as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params = req.params as any

    if (!body.slug || !body.title || !body.published_at || !body.expires_at) {
        return res.status(400).send({ error: 'slug, title, published_at and expires_at are required' })
    }

    if (!isValidSlug(body.slug)) {
        return res.status(400).send({ error: 'Slug can only contain lowercase letters, numbers, hyphens, and underscores' })
    }

    const publicationWindow = validatePublicationWindow(body.published_at, body.expires_at)
    if (!publicationWindow.valid) {
        return res.status(400).send({ error: publicationWindow.error })
    }

    const { publishedAt, expiresAt } = publicationWindow

    try {
        const newLimit = body.limit ? Number(body.limit) : null

        const countSql = await loadSQL('submissions/countRegistered.sql')
        const countResult = await run(countSql, [params.id])
        const registeredCount = countResult.rows[0].count

        if (newLimit !== null && newLimit < registeredCount) {
            return res.status(400).send({ error: 'Limit cannot be lower than the number of registered submissions' })
        }

        let spotsToFill = 0
        if (newLimit === null) {
            spotsToFill = 999999
        } else {
            spotsToFill = newLimit - registeredCount
        }

        if (spotsToFill > 0) {
            const getWaitlistSql = await loadSQL('submissions/getWaitlistBatch.sql')
            const updateStatusSql = await loadSQL('submissions/updateStatus.sql')
            
            const waitlistResult = await run(getWaitlistSql, [params.id, spotsToFill])
            const toPromote = waitlistResult.rows

            for (const submission of toPromote) {
                await run(updateStatusSql, [submission.id, 'registered'])
                if (submission.email) {
                    await sendTemplatedMail(submission.email, {
                        title: body.title,
                        status: 'bumped',
                        ownerEmail: body.owner_email,
                        submissionId: submission.id,
                        actionUrl: `${req.server.appConfig.FRONTEND_URL}/submissions/${submission.id}`,
                        actionText: 'View Submission'
                    })
                }
            }
        }

        const sqlParams = [
            params.id,
            body.slug,
            body.title,
            body.description || null,
            body.anonymous_submissions || false,
            body.limit || null,
            body.waitlist || false,
            body.multiple_submissions || false,
            publishedAt,
            expiresAt
        ]

        const sql = await loadSQL('forms/put.sql')
        const result = await run(sql, sqlParams)

        if (result.rows.length === 0) {
            return res.status(404).send({ error: 'Entity not found' })
        }

        res.send(result.rows[0])
    } catch (error) {
        return sendInternalServerError(res, 'Error updating entity:', error)
    }
}