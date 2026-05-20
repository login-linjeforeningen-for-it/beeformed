import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import type { FormIdAndIdParams } from '#schemas.ts'
import { handlePermissionDelete } from '#utils/shared/permission.ts'

export default function deleteFormPermission(req: AuthenticatedRequest<{ Params: FormIdAndIdParams }>, res: FastifyReply) {
    return handlePermissionDelete(req, res, {
        checkSqlPath: 'form-permissions/selectForDelete.sql',
        ownerField: 'form_owner_id',
        deleteSqlPath: 'form-permissions/delete.sql',
        parentIdParam: 'formId'
    })
}
