import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import { handlePermissionGrant } from '#utils/permissions/permissionGrants.ts'

export default async function createFormPermission(
    req: AuthenticatedRequest<{ Params: IdParams; Body: PermissionGrantBody }>,
    res: FastifyReply
) {
    return handlePermissionGrant(req, res, {
        resourceTable: 'forms',
        resourceLabel: 'Form',
        requiredResourceIdMessage: 'form_id and granted_by are required',
        insertSQLPath: 'form-permissions/post.sql'
    })
}
