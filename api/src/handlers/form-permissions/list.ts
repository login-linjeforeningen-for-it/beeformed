import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import type { IdParams } from '#schemas.ts'
import { handlePermissionGet } from '#utils/shared/permission.ts'

export default function listFormPermissions(req: AuthenticatedRequest<{ Params: IdParams }>, res: FastifyReply) {
    return handlePermissionGet(req, res, 'form-permissions/select.sql')
}
