import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import type { PermissionGrantBody, IdParams } from '#schemas.ts'
import { handlePermissionGrant } from '#utils/shared/permission.ts'

export default async function createTemplatePermission(
    req: AuthenticatedRequest<{ Params: IdParams; Body: PermissionGrantBody }>,
    res: FastifyReply
) {
    return handlePermissionGrant(req, res, {
        resourceLabel: 'Template',
        ownerCheckSqlPath: 'templates/selectOwnerForUpdate.sql',
        insertSQLPath: 'template-permissions/insert.sql'
    })
}
