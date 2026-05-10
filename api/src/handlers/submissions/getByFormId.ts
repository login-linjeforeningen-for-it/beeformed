import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import run from '#db'
import { checkPermission } from '#utils/permissions/checkPermissions.ts'
import { loadSQL, buildFilteredQuery } from '#utils/sql.ts'
import { buildListResponse } from '#utils/listResponse.ts'
import { logError } from '#utils/logger.ts'

export default async function getSubmissionsByForm(
    req: AuthenticatedRequest<{ Params: IdParams; Querystring: SubmissionsByFormQuerystring }>,
    res: FastifyReply
) {
    const formId = req.params.id
    const userId = req.user.id

    try {
        const hasPermission = await checkPermission(formId, userId, req.user.groups)
        if (!hasPermission) {
            return res.status(403).send({ error: 'Forbidden' })
        }

        const orderBy = req.query.order_by || 'submitted_at'
        const orderMap: Record<string, string> = {
            submitted_at: 's.submitted_at',
            id: 's.id',
            user_name: 'u.name',
            user_email: 'u.email',
            status: 's.status',
            scanned_at: 's.scanned_at'
        }
        if (!orderMap[orderBy]) {
            return res.status(400).send({ error: 'Invalid order_by parameter' })
        }

        const sqlFile = req.query.include_answers === 'true'
            ? 'submissions/getAllByFormWithAnswers.sql'
            : 'submissions/getAllByForm.sql'

        const { sql, params } = await buildFilteredQuery(
            sqlFile,
            [formId],
            req.query,
            undefined,
            {
                searchFieldKeys: ['email', 'name', 'submission_id'],
                searchFieldMap: {
                    email: 'u.email',
                    name: 'u.name',
                    submission_id: 's.id::text'
                },
                explicitOrderField: orderMap[orderBy]
            }
        )
        const result = await run(sql, params)
        const responseBody = buildListResponse(result.rows as Record<string, unknown>[])

        if (req.query.include_answers === 'true') {
            const fieldsSql = await loadSQL('form-fields/get.sql')
            const fieldsResult = await run(fieldsSql, [formId])
            return res.send({
                ...responseBody,
                fields: fieldsResult.rows
            })
        }

        return res.send(responseBody)
    } catch (error) {
        logError('Error getting submissions', {
            event: 'http.internal_error',
            requestId: req.id,
            error
        })
        return res.status(500).send({ error: 'Internal server error' })
    }
}
