import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { logError } from '#utils/logger.ts'

export default async function deleteUser(req: AuthenticatedRequest, res: FastifyReply) {
    const id = req.user.id

    try {
        const sql = await loadSQL('users/delete.sql')
        await run(sql, [id])
        return res.status(204).send()
    } catch (error) {
        logError('Error deleting entity', { event: 'http.internal_error', error })
        return res.status(500).send({ error: 'Internal server error' })
    }
}
