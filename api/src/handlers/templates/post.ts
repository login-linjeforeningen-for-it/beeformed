import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { logError } from '#utils/logger.ts'
import { hasRequiredGroup, isValidSlug, validatePublicationWindow, validateLengths, MAX_SLUG_LENGTH, MAX_TITLE_LENGTH, MAX_DESCRIPTION_LENGTH } from '#utils/validators.ts'

export default async function createTemplate(
    req: AuthenticatedRequest<{ Body: CreateTemplateBody }>,
    res: FastifyReply
) {
    const body = req.body
    const user_id = req.user.id

    if (!hasRequiredGroup(req.user.groups, 'QueenBee')) {
        return res.status(403).send({ error: 'Forbidden' })
    }

    if (!user_id || !body.slug || !body.title || !body.published_at || !body.expires_at) {
        return res.status(400).send({ error: 'user_id, slug, title, published_at, and expires_at are required' })
    }

    if (!isValidSlug(body.slug)) {
        return res.status(400).send({ error: 'Slug can only contain lowercase letters, numbers, hyphens, and underscores' })
    }

    const lengthError = validateLengths([
        { value: body.slug,        max: MAX_SLUG_LENGTH,        label: 'slug' },
        { value: body.title,       max: MAX_TITLE_LENGTH,       label: 'title' },
        { value: body.description, max: MAX_DESCRIPTION_LENGTH, label: 'description' },
    ])
    if (lengthError) return res.status(400).send({ error: lengthError })

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
        return res.status(201).send(result.rows[0])
    } catch (error) {
        if ((error as { code?: string }).code === '23505') {
            return res.status(409).send({ error: 'Slug is already taken' })
        }
        logError('Error creating entity', {
            event: 'http.internal_error',
            requestId: req.id,
            error
        })
        return res.status(500).send({ error: 'Internal server error' })
    }
}
