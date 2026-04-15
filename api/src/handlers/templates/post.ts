import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { sendInternalServerError } from '#utils/http/errors.ts'
import { hasRequiredGroup, isValidSlug, validatePublicationWindow } from '#utils/validation/validators.ts'

export default async function createTemplate(req: FastifyRequest, res: FastifyReply) {
    const body = req.body as {
        source_form_id?: string | null
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
    const user_id = req.user!.id

    if (req.user?.groups && !hasRequiredGroup(req.user.groups, 'QueenBee')) {
        return res.status(403).send({ error: 'Forbidden' })
    }

    if (!user_id || !body.slug || !body.title || !body.published_at || !body.expires_at) {
        return res.status(400).send({ error: 'user_id, slug, title, published_at, and expires_at are required' })
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

    const sqlParams = [
        user_id,
        body.source_form_id || null,
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

    try {
        const sql = await loadSQL('templates/post.sql')
        const result = await run(sql, sqlParams)
        res.status(201).send(result.rows[0])
    } catch (error) {
        return sendInternalServerError(res, 'Error creating entity:', error)
    }
}
