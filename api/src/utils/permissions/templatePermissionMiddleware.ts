import { checkTemplatePermission } from '#utils/permissions/checkTemplatePermissions.ts'
import { createPermissionMiddleware } from '#utils/permissions/permissions.ts'

export default createPermissionMiddleware({
    idParams: ['id', 'templateId'],
    missingIdMessage: 'Missing template ID',
    checkPermission: checkTemplatePermission
})
