import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import { buildFilteredQuery } from '#utils/sql.ts'

export default async function getSharedTemplates(req: FastifyRequest, res: FastifyReply) {
    const query = req.query as {
        search?: string
        limit?: string
        offset?: string
        order_by?: string
        sort?: string
    }

    try {
        const { sql, params } = await buildFilteredQuery('templates/getShared.sql', [req.user!.id, req.user!.groups], query, 't')

        const result = await run(sql, params)
        const data = result.rows
        const total = data.length > 0 ? (data[0] as Record<string, unknown>).total_count as number : 0

        res.send({ data, total })
    } catch (error) {
        if (error instanceof Error && error.message === 'Invalid order_by parameter') {
            return res.status(400).send({ error: error.message })
        }
        console.error('Error getting shared templates:', error)
        res.status(500).send({ error: 'Internal server error' })
    }
}
