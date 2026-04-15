import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import { loadSQL } from '#utils/sql.ts'

export default async function deleteTemplate(req: FastifyRequest, res: FastifyReply) {
    const params = req.params as { id?: string }
    const { id } = params

    if (!req.user?.groups || !req.user.groups.includes('QueenBee')) {
        return res.status(403).send({ error: 'Forbidden' })
    }

    if (!id) {
        return res.status(400).send({ error: 'id is required' })
    }

    try {
        const sql = await loadSQL('templates/delete.sql')
        const result = await run(sql, [id, req.user!.id])

        if (result.rowCount === 0) {
            return res.status(404).send({ error: 'Entity not found or permission denied' })
        }

        res.status(204).send()
    } catch (error) {
        console.error('Error deleting entity:', error)
        res.status(500).send({ error: 'Internal server error' })
    }
}
