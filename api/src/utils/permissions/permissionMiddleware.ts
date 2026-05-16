import { checkPermission, createPermissionMiddleware } from '#utils/permissions/permissions.ts'

export default createPermissionMiddleware({
    idParams: ['formId', 'id'],
    missingIdMessage: 'Missing form ID',
    checkPermission
})
