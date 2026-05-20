import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import type { IdParams, SubmissionByIdQuerystring } from '#schemas.ts'
import run from '#db'
import { loadSQL } from '#utils/db/sql.ts'

const selectSql = await loadSQL('submissions/selectById.sql')

export default async function getSubmission(
    req: AuthenticatedRequest<{ Params: IdParams; Querystring: SubmissionByIdQuerystring }>,
    res: FastifyReply
) {
    const { id } = req.params
    const { formId } = req.query

    const result = await run(selectSql, [id, req.user.id, formId || null, req.user.groups])
    const entity = result.rows[0] ?? null

    if (!entity) {
        return res.status(404).send({
            error: formId ? 'Submission not found or does not belong to this form' : 'Submission not found'
        })
    }

    return res.send(entity)
}
