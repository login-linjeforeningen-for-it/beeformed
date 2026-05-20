import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import type { IdParams, SubmissionsByFormQuerystring } from '#schemas.ts'
import run, { HttpError } from '#db'
import { loadSQL, buildFilteredQuery } from '#utils/db/sql.ts'
import { buildListResponse } from '#utils/db/listResponse.ts'

const fieldsSql = await loadSQL('form-fields/selectByForm.sql')

const ORDER_MAP: Record<string, string> = {
    submitted_at: 'submitted_at',
    id: 'id',
    user_name: 'user_name',
    user_email: 'user_email',
    status: 'status',
    scanned_at: 'scanned_at'
}

export default async function listSubmissionsByForm(
    req: AuthenticatedRequest<{ Params: IdParams; Querystring: SubmissionsByFormQuerystring }>,
    res: FastifyReply
) {
    const formId = req.params.id
    const orderBy = req.query.order_by || 'submitted_at'
    if (!ORDER_MAP[orderBy]) throw new HttpError(400, 'Invalid order_by parameter')

    const sqlFile = req.query.include_answers === 'true'
        ? 'submissions/selectByFormWithAnswers.sql'
        : 'submissions/selectByForm.sql'

    const { sql, params } = await buildFilteredQuery(
        sqlFile,
        [formId],
        req.query,
        { searchFields: ['user_email', 'user_name', 'id::text'], orderField: ORDER_MAP[orderBy] }
    )
    const result = await run(sql, params)
    const responseBody = buildListResponse(result.rows as Record<string, unknown>[])

    if (req.query.include_answers === 'true') {
        const fieldsResult = await run(fieldsSql, [formId])
        return res.send({ ...responseBody, fields: fieldsResult.rows })
    }

    return res.send(responseBody)
}
