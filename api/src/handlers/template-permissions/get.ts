import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import { loadSQL } from '#utils/sql.ts'

export default async function getTemplatePermissions(req: FastifyRequest, res: FastifyReply) {
    const params = req.params as { id?: string }
    const { id } = params

    if (!id) {
        return res.status(400).send({ error: 'id is required' })
    }

    try {
        const sql = await loadSQL('template-permissions/get.sql')
        const result = await run(sql, [id])
        res.send({ data: result.rows, total: result.rows.length })
    } catch (error) {
        console.error('Error reading entity:', error)
        res.status(500).send({ error: 'Internal server error' })
    }
}
