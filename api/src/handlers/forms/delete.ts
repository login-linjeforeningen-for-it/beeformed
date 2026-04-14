import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import { loadSQL } from '#utils/sql.ts'

export default async function deleteForm(req: FastifyRequest, res: FastifyReply) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params = req.params as any
    const { id } = params

    if (!req.user?.groups || !req.user.groups.includes('Aktiv')) {
        return res.status(403).send({ error: 'Forbidden' })
    }

    if (!id) {
        return res.status(400).send({ error: 'id is required' })
    }

    try {
        const sql = await loadSQL('forms/delete.sql')
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