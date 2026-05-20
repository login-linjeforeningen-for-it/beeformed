import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import type { UpdateTemplateBody, IdParams } from '#schemas.ts'
import run, { HttpError } from '#db'
import { loadSQL } from '#utils/db/sql.ts'

const updateSql = await loadSQL('templates/update.sql')

export default async function updateTemplate(
    req: AuthenticatedRequest<{ Params: IdParams; Body: UpdateTemplateBody }>,
    res: FastifyReply
) {
    const body = req.body

    const result = await run(updateSql, [
        req.params.id,
        body.slug,
        body.title,
        body.description ?? null,
        body.anonymous_submissions || false,
        body.limit ?? null,
        body.waitlist || false,
        body.multiple_submissions || false,
    ])

    if (result.rows.length === 0) throw new HttpError(404, 'Template not found')
    return res.send(result.rows[0])
}
