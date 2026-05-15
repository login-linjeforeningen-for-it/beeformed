import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { logError } from '#utils/logger.ts'

export default async function getSubmission(
    req: AuthenticatedRequest<{ Params: IdParams; Querystring: SubmissionByIdQuerystring }>,
    res: FastifyReply
) {
    const { id } = req.params
    const { formId } = req.query
    const userId = req.user.id

    try {
        const sql = await loadSQL('submissions/get.sql')
        const result = await run(sql, [id, userId, formId || null, req.user.groups])
        const entity = result.rows.length > 0 ? result.rows[0] : null

        if (!entity) {
            return res.status(404).send({
                error: formId
                    ? 'Submission not found or does not belong to this form'
                    : 'Submission not found'
            })
        }

        return res.send(entity)
    } catch (error) {
        logError('Error reading entity', {
            event: 'http.internal_error',
            requestId: req.id,
            error
        })
        return res.status(500).send({ error: 'Internal server error' })
    }
}
