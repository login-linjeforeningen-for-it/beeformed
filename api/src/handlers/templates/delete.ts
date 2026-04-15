import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { sendInternalServerError } from '#utils/http/errors.ts'
import { hasRequiredGroup } from '#utils/validation/validators.ts'
import { requireRouteParam } from '#utils/http/request.ts'

export default async function deleteTemplate(req: FastifyRequest, res: FastifyReply) {
    const id = requireRouteParam(req, res, { error: 'id is required' })
    if (!id) return

    if (!hasRequiredGroup(req.user?.groups, 'QueenBee')) {
        return res.status(403).send({ error: 'Forbidden' })
    }

    try {
        const sql = await loadSQL('templates/delete.sql')
        const result = await run(sql, [id, req.user!.id])

        if (result.rowCount === 0) {
            return res.status(404).send({ error: 'Entity not found or permission denied' })
        }

        res.status(204).send()
    } catch (error) {
        return sendInternalServerError(res, 'Error deleting entity:', error)
    }
}
