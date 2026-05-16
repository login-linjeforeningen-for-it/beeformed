import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import { handlePermissionDelete } from '#utils/permissions/permissionGrants.ts'

export default function deleteFormPermission(req: AuthenticatedRequest<{ Params: FormIdAndIdParams }>, res: FastifyReply) {
    return handlePermissionDelete(req, res, {
        checkSqlPath: 'form-permissions/selectForDelete.sql',
        ownerField: 'form_owner_id',
        deleteSqlPath: 'form-permissions/delete.sql'
    })
}
