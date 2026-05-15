import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { logError } from '#utils/logger.ts'
import { hasRequiredGroup, isValidSlug, validatePublicationWindow } from '#utils/validators.ts'

export default async function createForm(
    req: AuthenticatedRequest<{ Body: CreateOrUpdateFormBody }>,
    res: FastifyReply
) {
    const body = req.body
    const user_id = req.user.id

    if (!Array.isArray(req.user.groups) || !hasRequiredGroup(req.user.groups, 'Aktiv')) {
        return res.status(403).send({ error: 'Forbidden' })
    }

    if (!user_id || !body.slug || !body.title || !body.published_at || !body.expires_at) {
        return res.status(400).send({ error: 'user_id, slug, title, published_at, and expires_at are required' })
    }

    if (!isValidSlug(body.slug)) {
        return res.status(400).send({ error: 'Slug can only contain lowercase letters, numbers, hyphens, and underscores' })
    }

    const publicationWindow = validatePublicationWindow(body.published_at, body.expires_at, {
        baseDate: new Date(),
        maxRangeMonths: 6,
        maxRangeMessage: 'expires_at cannot be more than 6 months after created_at'
    })
    if (!publicationWindow.valid) {
        return res.status(400).send({ error: publicationWindow.error })
    }

    const publishedAt = publicationWindow.publishedAt as Date
    const expiresAt = publicationWindow.expiresAt as Date

    const sqlParams = [
        user_id,
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
        const sql = await loadSQL('forms/post.sql')
        const result = await run(sql, sqlParams)
        return res.status(201).send(result.rows[0])
    } catch (error) {
        logError('Error creating entity', { event: 'http.internal_error', error })
        return res.status(500).send({ error: 'Internal server error' })
    }
}
