import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import type { ListQuerystring } from '#schemas.ts'
import run, { HttpError } from '#db'
import { buildFilteredQuery } from '#utils/db/sql.ts'
import { buildListResponse } from '#utils/db/listResponse.ts'

const ORDER_MAP: Record<string, string> = {
    submitted_at: 'submitted_at',
    id: 'id',
    form_id: 'form_id',
    form_title: 'form_title',
    user_name: 'user_name',
    user_email: 'user_email'
}

export default async function listSubmissionsByUser(
    req: AuthenticatedRequest<{ Querystring: ListQuerystring }>,
    res: FastifyReply
) {
    const orderBy = req.query.order_by || 'submitted_at'
    if (!ORDER_MAP[orderBy]) throw new HttpError(400, 'Invalid order_by parameter')

    const { sql, params } = await buildFilteredQuery(
        'submissions/selectByUser.sql',
        [req.user.id],
        req.query,
        { searchFields: ['form_title', 'user_email', 'user_name'], orderField: ORDER_MAP[orderBy] }
    )
    const result = await run(sql, params)
    return res.send(buildListResponse(result.rows as Record<string, unknown>[]))
}
