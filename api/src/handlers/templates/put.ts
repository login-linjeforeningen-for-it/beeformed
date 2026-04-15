import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { sendInternalServerError } from '#utils/http/errors.ts'
import { isValidSlug, validatePublicationWindow } from '#utils/validation/validators.ts'
import { requireRouteParam } from '#utils/http/request.ts'

export default async function updateTemplate(req: FastifyRequest, res: FastifyReply) {
    const body = req.body as {
        slug?: string
        title?: string
        description?: string | null
        anonymous_submissions?: boolean
        limit?: number | null
        waitlist?: boolean
        multiple_submissions?: boolean
        published_at?: string
        expires_at?: string
    }
    const id = requireRouteParam(req, res, { error: 'id is required' })
    if (!id) return

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

    const publishedAt = publicationWindow.publishedAt as Date
    const expiresAt = publicationWindow.expiresAt as Date

    try {
        const sqlParams = [
            id,
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

        const sql = await loadSQL('templates/put.sql')
        const result = await run(sql, sqlParams)

        if (result.rows.length === 0) {
            return res.status(404).send({ error: 'Entity not found' })
        }

        res.send(result.rows[0])
    } catch (error) {
        return sendInternalServerError(res, 'Error updating entity:', error)
    }
}
