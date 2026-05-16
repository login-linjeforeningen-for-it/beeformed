import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { logError } from '#utils/logger.ts'

export default async function getLiveCount(req: FastifyRequest<{ Params: IdParams }>, res: FastifyReply) {
    const formId = req.params.id

    try {
        const sql = await loadSQL('submissions/liveCount.sql')
        const result = await run(sql, [formId])

        if (result.rows.length === 0) {
            return res.status(404).send({ error: 'Form not found' })
        }

        const row = result.rows[0] as { registered_count: number; limit: number | null }
        const spaces_left = row.limit !== null ? Math.max(0, row.limit - row.registered_count) : null

        return res.send({
            registered_count: row.registered_count,
            limit: row.limit,
            spaces_left,
        })
    } catch (error) {
        logError('Error getting live count', { event: 'http.internal_error', requestId: req.id, error })
        return res.status(500).send({ error: 'Internal server error' })
    }
}
