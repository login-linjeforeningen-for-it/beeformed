import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import { loadSQL } from '#utils/sql.ts'

export default async function getOneTemplate(req: FastifyRequest, res: FastifyReply) {
    const params = req.params as { id?: string }
    const { id } = params

    if (!id) {
        return res.status(400).send({ error: 'id is required' })
    }

    try {
        const sql = await loadSQL('templates/get.sql')
        const result = await run(sql, [id])
        const entity = result.rows.length > 0 ? result.rows[0] : null
        res.send(entity)
    } catch (error) {
        console.error('Error reading entity:', error)
        res.status(500).send({ error: 'Internal server error' })
    }
}
