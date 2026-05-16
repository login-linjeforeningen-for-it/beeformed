import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import run from '#db'
import { buildFilteredQuery } from '#utils/sql.ts'
import { buildListResponse } from '#utils/listResponse.ts'
import { logError } from '#utils/logger.ts'

export default async function listSharedTemplates(
    req: AuthenticatedRequest<{ Querystring: ListQuerystring }>,
    res: FastifyReply
) {
    try {
        const orderBy = req.query.order_by || 'created_at'
        const orderMap: Record<string, string> = {
            created_at: 't.created_at',
            updated_at: 't.updated_at',
            title: 't.title',
            expires_at: 't.expires_at',
            published_at: 't.published_at'
        }
        if (!orderMap[orderBy]) {
            return res.status(400).send({ error: 'Invalid order_by parameter' })
        }

        const { sql, params } = await buildFilteredQuery(
            'templates/selectShared.sql',
            [req.user.id, req.user.groups],
            req.query,
            't',
            { explicitOrderField: orderMap[orderBy] }
        )

        const result = await run(sql, params)
        return res.send(buildListResponse(result.rows as Record<string, unknown>[]))
    } catch (error) {
        logError('Error getting shared templates', {
            event: 'http.internal_error',
            requestId: req.id,
            error
        })
        return res.status(500).send({ error: 'Internal server error' })
    }
}
