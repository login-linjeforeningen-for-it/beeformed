import { handlePermissionGrant } from '#utils/permissions/permissionGrants.ts'
import type { AuthRequest } from '#utils/auth/authMiddleware.ts'

export default async function createFormPermission(req: AuthRequest) {
    return handlePermissionGrant(req, {
        resourceTable: 'forms',
        resourceLabel: 'Form',
        requiredResourceIdMessage: 'form_id and granted_by are required',
        insertSQLPath: 'form-permissions/post.sql'
    })
}
