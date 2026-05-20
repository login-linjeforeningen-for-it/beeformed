import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import run from '#db'
import { loadSQL } from '#utils/db/sql.ts'

const deleteSql = await loadSQL('users/delete.sql')

export default async function deleteUser(req: AuthenticatedRequest, res: FastifyReply) {
    await run(deleteSql, [req.user.id])
    return res.status(204).send()
}
