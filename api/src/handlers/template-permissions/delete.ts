import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import { handlePermissionDelete } from '#utils/permissions/permissionGrants.ts'

export default function deleteTemplatePermission(req: AuthenticatedRequest<{ Params: TemplateIdAndIdParams }>, res: FastifyReply) {
    return handlePermissionDelete(req, res, {
        checkSqlPath: 'template-permissions/selectForDelete.sql',
        ownerField: 'template_owner_id',
        deleteSqlPath: 'template-permissions/delete.sql'
    })
}
