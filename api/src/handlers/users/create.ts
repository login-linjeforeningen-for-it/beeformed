import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import run from '#db'
import { loadSQL } from '#utils/db/sql.ts'

const insertSql = await loadSQL('users/insert.sql')

export default async function createUser(req: AuthenticatedRequest, res: FastifyReply) {
    const { id: user_id, email, name } = req.user
    const result = await run(insertSql, [user_id, email, name])
    const { is_new, ...user } = result.rows[0]
    return res.status(is_new ? 201 : 200).send(user)
}
