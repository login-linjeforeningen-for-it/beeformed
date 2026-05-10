import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { logError } from '#utils/logger.ts'

export default async function getUser(req: AuthenticatedRequest, res: FastifyReply) {
    const id = req.user.id

    try {
        const sql = await loadSQL('users/get.sql')
        const result = await run(sql, [id])
        const entity = result.rows.length > 0 ? result.rows[0] : null
        return res.send(entity)
    } catch (error) {
        logError('Error reading entity', { event: 'http.internal_error', error })
        return res.status(500).send({ error: 'Internal server error' })
    }
}
