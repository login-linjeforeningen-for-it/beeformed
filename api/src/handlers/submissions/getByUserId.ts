import run from '#db'
import { buildFilteredQuery } from '#utils/sql.ts'
import { buildListResponse } from '#utils/http/listResponse.ts'
import { sendInternalServerError } from '#utils/http/errors.ts'
import type { AuthRequest } from '#utils/auth/authMiddleware.ts'

export default async function getSubmissionsByUser(req: AuthRequest) {
    const queryParams: any = Object.fromEntries(new URL(req.url).searchParams.entries());

    const userId = req.user.id
    const query = queryParams as {
        search?: string
        limit?: string
        offset?: string
        order_by?: string
        sort?: string
    }

    try {
        const orderBy = query.order_by || 'submitted_at'
        const orderMap: Record<string, string> = {
            submitted_at: 's.submitted_at',
            id: 's.id',
            form_id: 's.form_id',
            form_title: 'f.title',
            user_name: 'u.name',
            user_email: 'u.email'
        }
        if (!orderMap[orderBy]) {
            return Response.json({ error: 'Invalid order_by parameter' }, { status: 400 })
        }

        const { sql, params } = await buildFilteredQuery(
            'submissions/getAllByUser.sql',
            [userId],
            query,
            undefined,
            {
                searchFields: ['f.title', 'u.email', 'u.name'],
                explicitOrderField: orderMap[orderBy]
            }
        )
        const result = await run(sql, params)
        return Response.json(buildListResponse(result.rows as Record<string, unknown>[]))
    } catch (error) {
        return sendInternalServerError('Error reading entity:', error)
    }
}