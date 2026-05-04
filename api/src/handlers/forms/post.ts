import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { logError } from '#utils/logger.ts'
import { hasRequiredGroup, isValidSlug, validatePublicationWindow } from '#utils/validation/validators.ts'
import type { AuthRequest } from '#utils/auth/authMiddleware.ts'

export default async function createForm(req: AuthRequest) {
    const body = await req.json() as any
    const { id: user_id } = req.user

    if (!hasRequiredGroup(req.user.groups, 'Aktiv')) {
        return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!user_id || !body.slug || !body.title || !body.published_at || !body.expires_at) {
        return Response.json({ error: 'user_id, slug, title, published_at, and expires_at are required' }, { status: 400 })
    }

    if (!isValidSlug(body.slug)) {
        return Response.json({ error: 'Slug can only contain lowercase letters, numbers, hyphens, and underscores' }, { status: 400 })
    }

    const publicationWindow = validatePublicationWindow(body.published_at, body.expires_at, {
        baseDate: new Date(),
        maxRangeMonths: 6,
        maxRangeMessage: 'expires_at cannot be more than 6 months after created_at'
    })
    if (!publicationWindow.valid) {
        return Response.json({ error: publicationWindow.error }, { status: 400 })
    }

    const { publishedAt, expiresAt } = publicationWindow

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
        return Response.json(result.rows[0], { status: 201 })
    } catch (error) {
        logError('Error creating entity', {
            event: 'http.internal_error',
            requestId: req.context?.requestId,
            error
        })
        return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
}