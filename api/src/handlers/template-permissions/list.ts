import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import { handlePermissionGet } from '#utils/permissions/permissionGrants.ts'

export default function listTemplatePermissions(req: AuthenticatedRequest<{ Params: IdParams }>, res: FastifyReply) {
    return handlePermissionGet(req, res, 'template-permissions/select.sql')
}
