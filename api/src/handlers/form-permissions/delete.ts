import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { logError } from '#utils/logger.ts'

export default async function deleteFormPermission(req: AuthenticatedRequest<{ Params: FormIdAndIdParams }>, res: FastifyReply) {
    try {
        const sql = await loadSQL('form-permissions/delete.sql')
        const result = await run(sql, [req.params.id, req.user.id])

        if (result.rowCount === 0) {
            return res.status(404).send({ error: 'Entity not found or permission denied' })
        }

        return res.status(204).send()
    } catch (error) {
        logError('Error deleting entity', {
            event: 'http.internal_error',
            requestId: req.id,
            error
        })
        return res.status(500).send({ error: 'Internal server error' })
    }
}
