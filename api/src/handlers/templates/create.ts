import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import type { CreateTemplateBody } from '#schemas.ts'
import run from '#db'
import { loadSQL } from '#utils/db/sql.ts'

const insertSql = await loadSQL('templates/insert.sql')

export default async function createTemplate(
    req: AuthenticatedRequest<{ Body: CreateTemplateBody }>,
    res: FastifyReply
) {
    const body = req.body

    const result = await run(insertSql, [
        req.user.id,
        body.source_form_id || null,
        body.slug,
        body.title,
        body.description ?? null,
        body.anonymous_submissions || false,
        body.limit ?? null,
        body.waitlist || false,
        body.multiple_submissions || false,
    ])
    return res.status(201).send(result.rows[0])
}
