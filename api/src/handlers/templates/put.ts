import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { sendInternalServerError } from '#utils/http/errors.ts'
import { isValidSlug, validatePublicationWindow } from '#utils/validation/validators.ts'

import type { AuthRequest } from '#utils/auth/authMiddleware.ts'

export default async function updateTemplate(req: AuthRequest<'id'>) {
    const body = await req.json() as  {
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
    const { id } = req.params
    if (!id) return Response.json({ error: 'id is required' }, { status: 400 })

    if (!body.slug || !body.title || !body.published_at || !body.expires_at) {
        return Response.json({ error: 'slug, title, published_at and expires_at are required' }, { status: 400 })
    }

    if (!isValidSlug(body.slug)) {
        return Response.json({ error: 'Slug can only contain lowercase letters, numbers, hyphens, and underscores' }, { status: 400 })
    }

    const publicationWindow = validatePublicationWindow(body.published_at, body.expires_at)
    if (!publicationWindow.valid) {
        return Response.json({ error: publicationWindow.error }, { status: 400 })
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
            return Response.json({ error: 'Entity not found' }, { status: 404 })
        }

        return Response.json(result.rows[0])
    } catch (error) {
        return sendInternalServerError('Error updating entity:', error)
    }
}
