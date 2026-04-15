import { createPermissionChecker } from '#utils/permissions/permissions.ts'

export const checkTemplatePermission = createPermissionChecker(
    'template-permissions/checkPermission.sql',
    'Error checking template permission:'
)
