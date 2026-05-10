import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import run from '#db'
import { buildFilteredQuery } from '#utils/sql.ts'
import { buildListResponse } from '#utils/listResponse.ts'
import { logError } from '#utils/logger.ts'

export default async function getSharedForms(
    req: AuthenticatedRequest<{ Querystring: ListQuerystring }>,
    res: FastifyReply
) {
    try {
        const { sql, params } = await buildFilteredQuery('forms/getShared.sql', [req.user.id, req.user.groups], req.query, 'f')

        const result = await run(sql, params)
        return res.send(buildListResponse(result.rows as Record<string, unknown>[]))
    } catch (error) {
        if (error instanceof Error && error.message === 'Invalid order_by parameter') {
            return res.status(400).send({ error: error.message })
        }
        logError('Error getting shared forms', { event: 'http.internal_error', error })
        return res.status(500).send({ error: 'Internal server error' })
    }
}
