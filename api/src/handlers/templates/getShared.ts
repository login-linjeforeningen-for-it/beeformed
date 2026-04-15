import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import { buildFilteredQuery } from '#utils/sql.ts'
import { buildListResponse } from '#utils/http/listResponse.ts'
import { isInvalidOrderByError, sendInternalServerError } from '#utils/http/errors.ts'

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
        return res.send(buildListResponse(result.rows as Record<string, unknown>[]))
    } catch (error) {
        if (isInvalidOrderByError(error)) {
            return res.status(400).send({ error: error.message })
        }
        return sendInternalServerError(res, 'Error getting shared templates:', error)
    }
}
