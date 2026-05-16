import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import run from '#db'
import { buildFilteredQuery } from '#utils/sql.ts'
import { buildListResponse } from '#utils/listResponse.ts'
import { logError } from '#utils/logger.ts'

export default async function listForms(
    req: AuthenticatedRequest<{ Querystring: ListQuerystring }>,
    res: FastifyReply
) {
    try {
        const orderBy = req.query.order_by || 'created_at'
        const orderMap: Record<string, string> = {
            created_at: 'created_at',
            updated_at: 'updated_at',
            title: 'title',
            expires_at: 'expires_at',
            published_at: 'published_at'
        }
        if (!orderMap[orderBy]) {
            return res.status(400).send({ error: 'Invalid order_by parameter' })
        }

        const { sql, params } = await buildFilteredQuery(
            'forms/selectByUser.sql',
            [req.user.id],
            req.query,
            undefined,
            { explicitOrderField: orderMap[orderBy] }
        )

        const result = await run(sql, params)
        return res.send(buildListResponse(result.rows as Record<string, unknown>[]))
    } catch (error) {
        logError('Error getting forms', { event: 'http.internal_error', error })
        return res.status(500).send({ error: 'Internal server error' })
    }
}
