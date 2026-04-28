import run from '#db'
import { checkPermission } from '#utils/permissions/checkPermissions.ts'
import { loadSQL, buildFilteredQuery } from '#utils/sql.ts'
import { buildListResponse } from '#utils/http/listResponse.ts'
import { sendInternalServerError } from '#utils/http/errors.ts'
import type { AuthRequest } from '#utils/auth/authMiddleware.ts'

export default async function getSubmissionsByForm(req: AuthRequest) {
    const queryParams: any = Object.fromEntries(new URL(req.url).searchParams.entries());

    const { id: formId } = req.params as { id: string }
    const userId = req.user.id
    const query = queryParams as {
        search?: string
        limit?: string
        offset?: string
        order_by?: string
        sort?: string
        include_answers?: string
    }

    try {
        const hasPermission = await checkPermission(formId, userId, req.user.groups || [])
        if (!hasPermission) {
            return Response.json({ error: 'Forbidden' }, { status: 403 })
        }

        const orderBy = query.order_by || 'submitted_at'
        const orderMap: Record<string, string> = {
            submitted_at: 's.submitted_at',
            id: 's.id',
            user_name: 'u.name',
            user_email: 'u.email',
            status: 's.status',
            scanned_at: 's.scanned_at'
        }
        if (!orderMap[orderBy]) {
            return Response.json({ error: 'Invalid order_by parameter' }, { status: 400 })
        }

        const sqlFile = query.include_answers === 'true'
            ? 'submissions/getAllByFormWithAnswers.sql'
            : 'submissions/getAllByForm.sql'

        const { sql, params } = await buildFilteredQuery(
            sqlFile,
            [formId],
            query,
            undefined,
            {
                searchFields: ['u.email', 'u.name', 's.id::text'],
                explicitOrderField: orderMap[orderBy]
            }
        )
        const result = await run(sql, params)
        const responseBody = buildListResponse(result.rows as Record<string, unknown>[])

        if (query.include_answers === 'true') {
            const fieldsSql = await loadSQL('form-fields/get.sql')
            const fieldsResult = await run(fieldsSql, [formId])
            return Response.json({
                ...responseBody,
                fields: fieldsResult.rows
            })
        }

        return Response.json(responseBody)
    } catch (error) {
        return sendInternalServerError('Error getting submissions:', error)
    }
}