import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { logError } from '#utils/logger.ts'

export default async function createUser(req: AuthenticatedRequest, res: FastifyReply) {
    const { id: user_id, email, name } = req.user

    try {
        const sql = await loadSQL('users/insert.sql')
        const result = await run(sql, [user_id, email, name])
        return res.status(201).send(result.rows[0])
    } catch (error) {
        logError('Error creating entity', { event: 'http.internal_error', error })
        return res.status(500).send({ error: 'Internal server error' })
    }
}
