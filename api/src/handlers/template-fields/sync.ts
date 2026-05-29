import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import type { BulkTemplateFieldOperation, IdParams } from '#schemas.ts'
import { runInTransaction } from '#db'
import { executeBulkFieldOps } from '#utils/shared/bulkFields.ts'

export default async function syncTemplateFields(
    req: AuthenticatedRequest<{ Params: IdParams; Body: BulkTemplateFieldOperation[] }>,
    res: FastifyReply
) {
    const results = await runInTransaction(client =>
        executeBulkFieldOps(client, req.body, req.params.id, {
            entityIdKey: 'template_id',
            entityType: 'template',
            sqlDir: 'template-fields',
            softDeleteWhenReferenced: false
        })
    )
    return res.status(200).send(results)
}
