import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import type { PermissionGrantBody, IdParams } from '#schemas.ts'
import { handlePermissionGrant } from '#utils/shared/permission.ts'

export default async function createFormPermission(
    req: AuthenticatedRequest<{ Params: IdParams; Body: PermissionGrantBody }>,
    res: FastifyReply
) {
    return handlePermissionGrant(req, res, {
        resourceLabel: 'Form',
        ownerCheckSqlPath: 'forms/selectOwnerForUpdate.sql',
        insertSQLPath: 'form-permissions/insert.sql'
    })
}
