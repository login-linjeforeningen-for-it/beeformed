import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import run from '#db'
import { loadSQL } from '#utils/db/sql.ts'

const selectSql = await loadSQL('users/select.sql')

export default async function getUser(req: AuthenticatedRequest, res: FastifyReply) {
    const result = await run(selectSql, [req.user.id])
    if (result.rows.length === 0) return res.status(404).send({ error: 'User not found' })
    return res.send(result.rows[0])
}
