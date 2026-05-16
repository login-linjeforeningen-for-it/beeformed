import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import type { BulkFormFieldOperation } from '#/schemas.ts'
import { runInTransaction } from '#db'
import { executeBulkFieldOps } from '#utils/bulkFields.ts'
import { logError } from '#utils/logger.ts'

export default async function syncFormFields(
    req: AuthenticatedRequest<{ Params: IdParams; Body: BulkFormFieldOperation[] }>,
    res: FastifyReply
) {
    try {
        const results = await runInTransaction(client =>
            executeBulkFieldOps(client, req.body, req.params.id, {
                entityIdKey: 'form_id',
                entityType: 'form',
                sqlDir: 'form-fields'
            })
        )
        return res.status(200).send(results)
    } catch (error: unknown) {
        const err = error as Error & { statusCode?: number }
        if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
            return res.status(err.statusCode).send({ error: err.message })
        }
        logError('Error in bulk save', { event: 'http.internal_error', requestId: req.id, error })
        return res.status(500).send({ error: 'Internal server error' })
    }
}
