import { checkPermission, createPermissionMiddleware } from '#utils/permissions/permissions.ts'

export default createPermissionMiddleware({
    idParams: ['id', 'formId'],
    missingIdMessage: 'Missing form ID',
    checkPermission
})
