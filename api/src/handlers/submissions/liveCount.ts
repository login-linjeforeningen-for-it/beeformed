import type { FastifyReply, FastifyRequest } from 'fastify'
import type { IdParams } from '#schemas.ts'
import run from '#db'
import { loadSQL } from '#utils/db/sql.ts'

const liveCountSql = await loadSQL('submissions/liveCount.sql')

export default async function getLiveCount(req: FastifyRequest<{ Params: IdParams }>, res: FastifyReply) {
    const result = await run(liveCountSql, [req.params.id])
    if (result.rows.length === 0) return res.status(404).send({ error: 'Form not found' })

    const row = result.rows[0] as { registered_count: number; limit: number | null }
    const spaces_left = row.limit !== null ? Math.max(0, row.limit - row.registered_count) : null

    return res.send({ registered_count: row.registered_count, limit: row.limit, spaces_left })
}
