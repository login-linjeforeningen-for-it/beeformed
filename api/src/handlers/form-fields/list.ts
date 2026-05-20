import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import type { IdParams } from '#schemas.ts'
import run from '#db'
import { loadSQL } from '#utils/db/sql.ts'

const selectSql = await loadSQL('form-fields/selectByForm.sql')

export default async function listFormFields(req: AuthenticatedRequest<{ Params: IdParams }>, res: FastifyReply) {
    const result = await run(selectSql, [req.params.id])
    return res.send(result.rows)
}
