import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import { loadSQL } from '#utils/sql.ts'

export default async function createForm(req: FastifyRequest, res: FastifyReply) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = req.body as any
    const user_id = req.user!.id

    if (req.user?.groups && !req.user.groups.includes('Aktiv')) {
        return res.status(403).send({ error: 'Forbidden' })
    }

    if (!user_id || !body.slug || !body.title || !body.published_at || !body.expires_at) {
        return res.status(400).send({ error: 'user_id, slug, title, published_at, and expires_at are required' })
    }

    if (!/^[a-z0-9-_]+$/.test(body.slug)) {
        return res.status(400).send({ error: 'Slug can only contain lowercase letters, numbers, hyphens, and underscores' })
    }

    const publishedAt = new Date(body.published_at)
    const expiresAt = new Date(body.expires_at)
    if (isNaN(publishedAt.getTime()) || isNaN(expiresAt.getTime())) {
        return res.status(400).send({ error: 'published_at and expires_at must be valid dates' })
    }
    else if (publishedAt >= expiresAt) {
        return res.status(400).send({ error: 'expires_at must be later than published_at' })
    }
    else if (expiresAt.getTime() - new Date().getTime() > 365 * 24 * 60 * 60 * 1000) {
        return res.status(400).send({ error: 'expire date cannot be more than one year in the future' })
    }

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
        res.status(201).send(result.rows[0])
    } catch (error) {
        console.error('Error creating entity:', error)
        res.status(500).send({ error: 'Internal server error' })
    }
}