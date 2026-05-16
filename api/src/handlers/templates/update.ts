import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import type { UpdateTemplateBody } from '#/schemas.ts'
import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { logError } from '#utils/logger.ts'
import { validatePublicationWindow } from '#utils/validators.ts'

export default async function updateTemplate(
    req: AuthenticatedRequest<{ Params: IdParams; Body: UpdateTemplateBody }>,
    res: FastifyReply
) {
    const body = req.body
    const id = req.params.id

    if (body.anonymous_submissions && body.waitlist) {
        return res.status(400).send({ error: 'Waitlist cannot be enabled for anonymous submission forms' })
    }

    const publicationWindow = validatePublicationWindow(body.published_at, body.expires_at)
    if (!publicationWindow.valid) {
        return res.status(400).send({ error: publicationWindow.error })
    }

    const publishedAt = publicationWindow.publishedAt as Date
    const expiresAt = publicationWindow.expiresAt as Date

    try {
        const sqlParams = [
            id,
            body.slug,
            body.title,
            body.description ?? null,
            body.anonymous_submissions || false,
            body.limit ?? null,
            body.waitlist || false,
            body.multiple_submissions || false,
            publishedAt,
            expiresAt
        ]

        const sql = await loadSQL('templates/update.sql')
        const result = await run(sql, sqlParams)

        if (result.rows.length === 0) {
            return res.status(404).send({ error: 'Entity not found' })
        }

        return res.send(result.rows[0])
    } catch (error) {
        logError('Error updating entity', {
            event: 'http.internal_error',
            requestId: req.id,
            error
        })
        return res.status(500).send({ error: 'Internal server error' })
    }
}
