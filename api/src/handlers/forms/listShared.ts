import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import run from '#db'
import { buildFilteredQuery } from '#utils/sql.ts'
import { buildListResponse } from '#utils/listResponse.ts'
import { logError } from '#utils/logger.ts'

export default async function listSharedForms(
    req: AuthenticatedRequest<{ Querystring: ListQuerystring }>,
    res: FastifyReply
) {
    try {
        const orderBy = req.query.order_by || 'created_at'
        const orderMap: Record<string, string> = {
            created_at: 'f.created_at',
            updated_at: 'f.updated_at',
            title: 'f.title',
            expires_at: 'f.expires_at',
            published_at: 'f.published_at'
        }
        if (!orderMap[orderBy]) {
            return res.status(400).send({ error: 'Invalid order_by parameter' })
        }

        const { sql, params } = await buildFilteredQuery(
            'forms/selectShared.sql',
            [req.user.id, req.user.groups],
            req.query,
            'f',
            { explicitOrderField: orderMap[orderBy] }
        )

        const result = await run(sql, params)
        return res.send(buildListResponse(result.rows as Record<string, unknown>[]))
    } catch (error) {
        logError('Error getting shared forms', { event: 'http.internal_error', error })
        return res.status(500).send({ error: 'Internal server error' })
    }
}
