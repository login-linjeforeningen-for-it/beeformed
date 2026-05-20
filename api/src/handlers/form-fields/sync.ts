import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import type { BulkFormFieldOperation, IdParams } from '#schemas.ts'
import { runInTransaction } from '#db'
import { executeBulkFieldOps } from '#utils/shared/bulkFields.ts'

export default async function syncFormFields(
    req: AuthenticatedRequest<{ Params: IdParams; Body: BulkFormFieldOperation[] }>,
    res: FastifyReply
) {
    const results = await runInTransaction(client =>
        executeBulkFieldOps(client, req.body, req.params.id, {
            entityIdKey: 'form_id',
            entityType: 'form',
            sqlDir: 'form-fields'
        })
    )
    return res.status(200).send(results)
}
