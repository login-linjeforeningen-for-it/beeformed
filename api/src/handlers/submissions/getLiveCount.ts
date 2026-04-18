import type { FastifyRequest, FastifyReply } from 'fastify'
import run from '#db'
import { loadSQL } from '#utils/sql.ts'

export default async function getLiveCount(req: FastifyRequest, reply: FastifyReply) {
    const { id: formId } = req.params as { id: string }

    const sql = await loadSQL('submissions/liveCount.sql')
    const result = await run(sql, [formId])

    if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'Form not found' })
    }

    const row = result.rows[0] as { registered_count: number; limit: number | null }
    const spaces_left = row.limit !== null ? Math.max(0, row.limit - row.registered_count) : null

    return reply.send({
        registered_count: row.registered_count,
        limit: row.limit,
        spaces_left,
    })
}
