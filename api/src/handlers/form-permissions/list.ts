import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import { handlePermissionGet } from '#utils/permissions/permissionGrants.ts'

export default function listFormPermissions(req: AuthenticatedRequest<{ Params: IdParams }>, res: FastifyReply) {
    return handlePermissionGet(req, res, 'form-permissions/select.sql')
}
