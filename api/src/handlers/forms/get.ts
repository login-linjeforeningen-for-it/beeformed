import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { logError } from '#utils/logger.ts'

export default async function getForm(req: AuthenticatedRequest<{ Params: IdParams }>, res: FastifyReply) {
    try {
        const sql = await loadSQL('forms/selectById.sql')
        const result = await run(sql, [req.params.id])
        const entity = result.rows.length > 0 ? result.rows[0] : null

        if (!entity) {
            return res.status(404).send({ error: 'Form not found' })
        }

        return res.send(entity)
    } catch (error) {
        logError('Error reading entity', { event: 'http.internal_error', error })
        return res.status(500).send({ error: 'Internal server error' })
    }
}
