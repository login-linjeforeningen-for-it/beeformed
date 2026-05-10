import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { logError } from '#utils/logger.ts'

export default async function getFormPermissions(req: AuthenticatedRequest<{ Params: IdParams }>, res: FastifyReply) {
    try {
        const sql = await loadSQL('form-permissions/get.sql')
        const result = await run(sql, [req.params.id])
        return res.send({ data: result.rows, total: result.rows.length })
    } catch (error) {
        logError('Error reading entity', {
            event: 'http.internal_error',
            requestId: req.id,
            error
        })
        return res.status(500).send({ error: 'Internal server error' })
    }
}
