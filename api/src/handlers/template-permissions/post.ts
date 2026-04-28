import { handlePermissionGrant } from '#utils/permissions/permissionGrants.ts'
import type { AuthRequest } from '#utils/auth/authMiddleware.ts'

export default async function createTemplatePermission(req: AuthRequest) {
    return handlePermissionGrant(req, {
        resourceTable: 'form_templates',
        resourceLabel: 'Template',
        requiredResourceIdMessage: 'template_id and granted_by are required',
        insertSQLPath: 'template-permissions/post.sql'
    })
}
