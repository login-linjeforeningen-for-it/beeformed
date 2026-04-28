import run from '#db'
import { buildFilteredQuery } from '#utils/sql.ts'
import { buildListResponse } from '#utils/http/listResponse.ts'
import { isInvalidOrderByError, sendInternalServerError } from '#utils/http/errors.ts'
import type { AuthRequest } from '#utils/auth/authMiddleware.ts'

export default async function getSharedTemplates(req: AuthRequest) {
    const queryParams: any = Object.fromEntries(new URL(req.url).searchParams.entries());

    const query = queryParams as {
        search?: string
        limit?: string
        offset?: string
        order_by?: string
        sort?: string
    }

    try {
        const { sql, params } = await buildFilteredQuery('templates/getShared.sql', [req.user.id, req.user.groups], query, 't')

        const result = await run(sql, params)
        return Response.json(buildListResponse(result.rows as Record<string, unknown>[]))
    } catch (error) {
        if (isInvalidOrderByError(error)) {
            return Response.json({ error: error.message }, { status: 400 })
        }
        return sendInternalServerError('Error getting shared templates:', error)
    }
}
