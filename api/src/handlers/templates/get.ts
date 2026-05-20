import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import type { IdParams } from '#schemas.ts'
import run from '#db'
import { loadSQL } from '#utils/db/sql.ts'

const selectSql = await loadSQL('templates/selectById.sql')

export default async function getTemplate(req: AuthenticatedRequest<{ Params: IdParams }>, res: FastifyReply) {
    const result = await run(selectSql, [req.params.id])
    const entity = result.rows[0] ?? null
    if (!entity) return res.status(404).send({ error: 'Template not found' })
    return res.send(entity)
}
