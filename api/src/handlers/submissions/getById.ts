import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { sendInternalServerError } from '#utils/http/errors.ts'
import { requireRouteParam } from '#utils/http/request.ts'

export default async function getSubmission(req: FastifyRequest, res: FastifyReply) {
    const id = requireRouteParam(req, res, { error: 'id is required' })
    if (!id) return
    const { formId } = req.query as { formId?: string }
    const userId = req.user!.id

    try {
        const sql = await loadSQL('submissions/get.sql')
        const result = await run(sql, [id, userId, formId || null])
        const entity = result.rows.length > 0 ? result.rows[0] : null
        
        if (!entity && formId) {
            return res.status(404).send({ error: 'Submission not found or does not belong to this form' })
        }
        
        res.send(entity)
    } catch (error) {
        return sendInternalServerError(res, 'Error reading entity:', error)
    }
}