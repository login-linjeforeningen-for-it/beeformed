import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import type { PermissionGrantBody } from '#/schemas.ts'
import { handlePermissionGrant } from '#utils/permissions/permissionGrants.ts'

export default async function createTemplatePermission(
    req: AuthenticatedRequest<{ Params: IdParams; Body: PermissionGrantBody }>,
    res: FastifyReply
) {
    return handlePermissionGrant(req, res, {
        resourceTable: 'form_templates',
        resourceLabel: 'Template',
        insertSQLPath: 'template-permissions/insert.sql'
    })
}
