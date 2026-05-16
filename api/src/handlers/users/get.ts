import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { logError } from '#utils/logger.ts'

export default async function getUser(req: AuthenticatedRequest, res: FastifyReply) {
    const id = req.user.id

    try {
        const sql = await loadSQL('users/select.sql')
        const result = await run(sql, [id])
        if (result.rows.length === 0) {
            return res.status(404).send({ error: 'User not found' })
        }
        return res.send(result.rows[0])
    } catch (error) {
        logError('Error reading entity', { event: 'http.internal_error', error })
        return res.status(500).send({ error: 'Internal server error' })
    }
}
