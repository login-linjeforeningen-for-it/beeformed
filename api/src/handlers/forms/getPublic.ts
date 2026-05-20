import type { FastifyReply, FastifyRequest } from 'fastify'
import type { SlugOrIdParams } from '#schemas.ts'
import run from '#db'
import { loadSQL } from '#utils/db/sql.ts'

const selectSql = await loadSQL('forms/selectPublic.sql')

export default async function getPublicForm(req: FastifyRequest<{ Params: SlugOrIdParams }>, res: FastifyReply) {
    const userId = req.optionalUser?.id ?? null
    const result = await run(selectSql, [req.params.id, userId])
    const entity = result.rows[0] ?? null
    if (!entity) return res.status(404).send({ error: 'Form not found' })
    return res.send(entity)
}
