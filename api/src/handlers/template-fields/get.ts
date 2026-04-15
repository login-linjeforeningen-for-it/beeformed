import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { sendInternalServerError } from '#utils/http/errors.ts'
import { requireRouteParam } from '#utils/http/request.ts'

export default async function getTemplateFields(req: FastifyRequest, res: FastifyReply) {
    const id = requireRouteParam(req, res, { error: 'id is required' })
    if (!id) return

    try {
        const sql = await loadSQL('template-fields/get.sql')
        const result = await run(sql, [id])
        res.send(result.rows)
    } catch (error) {
        return sendInternalServerError(res, 'Error reading entity:', error)
    }
}
