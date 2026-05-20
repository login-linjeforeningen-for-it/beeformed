import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import type { CreateOrUpdateFormBody } from '#schemas.ts'
import run from '#db'
import { loadSQL } from '#utils/db/sql.ts'
import { validatePublicationWindow } from '#utils/validators.ts'

const insertSql = await loadSQL('forms/insert.sql')

export default async function createForm(
    req: AuthenticatedRequest<{ Body: CreateOrUpdateFormBody }>,
    res: FastifyReply
) {
    const body = req.body

    const { publishedAt, expiresAt } = validatePublicationWindow(body.published_at, body.expires_at, {
        maxRangeMessage: 'expires_at cannot be more than 6 months from now'
    })

    const result = await run(insertSql, [
        req.user.id,
        body.slug,
        body.title,
        body.description ?? null,
        body.anonymous_submissions || false,
        body.limit ?? null,
        body.waitlist || false,
        body.multiple_submissions || false,
        publishedAt,
        expiresAt
    ])
    return res.status(201).send(result.rows[0])
}
