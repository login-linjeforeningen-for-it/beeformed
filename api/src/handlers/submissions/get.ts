import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import { loadSQL } from '#utils/sql.ts'

export default async function getSubmission(req: FastifyRequest, res: FastifyReply) {
    const { id } = req.params as { id: string }
    const { formId } = req.query as { formId?: string }
    const userId = req.user!.id

    if (!id) {
        return res.status(400).send({ error: 'id is required' })
    }

    try {
        const sql = await loadSQL('submissions/get.sql')
        const result = await run(sql, [id, userId, formId || null])
        const entity = result.rows.length > 0 ? result.rows[0] : null
        
        if (!entity && formId) {
            return res.status(404).send({ error: 'Submission not found or does not belong to this form' })
        }
        
        res.send(entity)
    } catch (error) {
        console.error('Error reading entity:', error)
        res.status(500).send({ error: 'Internal server error' })
    }
}