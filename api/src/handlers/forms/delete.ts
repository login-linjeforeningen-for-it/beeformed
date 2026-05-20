import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import type { IdParams } from '#schemas.ts'
import { runInTransaction, HttpError } from '#db'
import { loadSQL } from '#utils/db/sql.ts'

const selectOwnerSql = await loadSQL('forms/selectOwnerForUpdate.sql')
const deleteSql = await loadSQL('forms/delete.sql')

export default async function deleteForm(req: AuthenticatedRequest<{ Params: IdParams }>, res: FastifyReply) {
    await runInTransaction(async (client) => {
        const ownerResult = await client.query(selectOwnerSql, [req.params.id])
        if (ownerResult.rows.length === 0) throw new HttpError(404, 'Form not found')
        if (ownerResult.rows[0].user_id !== req.user.id) throw new HttpError(403, 'Forbidden')
        await client.query(deleteSql, [req.params.id, req.user.id])
    })
    return res.status(204).send()
}
