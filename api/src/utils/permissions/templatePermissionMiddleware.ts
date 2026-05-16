import { checkTemplatePermission, createPermissionMiddleware } from '#utils/permissions/permissions.ts'

export default createPermissionMiddleware({
    idParams: ['templateId', 'id'],
    missingIdMessage: 'Missing template ID',
    checkPermission: checkTemplatePermission
})
