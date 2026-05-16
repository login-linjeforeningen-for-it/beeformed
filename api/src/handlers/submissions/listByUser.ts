import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import run from '#db'
import { buildFilteredQuery } from '#utils/sql.ts'
import { buildListResponse } from '#utils/listResponse.ts'
import { logError } from '#utils/logger.ts'

export default async function listSubmissionsByUser(
    req: AuthenticatedRequest<{ Querystring: ListQuerystring }>,
    res: FastifyReply
) {
    const userId = req.user.id

    try {
        const orderBy = req.query.order_by || 'submitted_at'
        const orderMap: Record<string, string> = {
            submitted_at: 's.submitted_at',
            id: 's.id',
            form_id: 's.form_id',
            form_title: 'f.title',
            user_name: 'u.name',
            user_email: 'u.email'
        }
        if (!orderMap[orderBy]) {
            return res.status(400).send({ error: 'Invalid order_by parameter' })
        }

        const { sql, params } = await buildFilteredQuery(
            'submissions/selectByUser.sql',
            [userId],
            req.query,
            undefined,
            {
                searchFields: ['f.title', 'u.email', 'u.name'],
                explicitOrderField: orderMap[orderBy]
            }
        )
        const result = await run(sql, params)
        return res.send(buildListResponse(result.rows as Record<string, unknown>[]))
    } catch (error) {
        logError('Error reading entity', {
            event: 'http.internal_error',
            requestId: req.id,
            error
        })
        return res.status(500).send({ error: 'Internal server error' })
    }
}
