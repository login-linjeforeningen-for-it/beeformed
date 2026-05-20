import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import type { ListQuerystring } from '#schemas.ts'
import run, { HttpError } from '#db'
import { buildFilteredQuery } from '#utils/db/sql.ts'
import { buildListResponse } from '#utils/db/listResponse.ts'

const ORDER_MAP: Record<string, string> = {
    created_at: 'created_at',
    updated_at: 'updated_at',
    title: 'title',
}

export default async function listTemplates(
    req: AuthenticatedRequest<{ Querystring: ListQuerystring }>,
    res: FastifyReply
) {
    const orderBy = req.query.order_by || 'created_at'
    if (!ORDER_MAP[orderBy]) throw new HttpError(400, 'Invalid order_by parameter')

    const { sql, params } = await buildFilteredQuery(
        'templates/selectByUser.sql',
        [req.user.id],
        req.query,
        { orderField: ORDER_MAP[orderBy] }
    )

    const result = await run(sql, params)
    return res.send(buildListResponse(result.rows as Record<string, unknown>[]))
}
