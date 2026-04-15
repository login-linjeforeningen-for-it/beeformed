import { createPermissionChecker } from '#utils/permissions/permissions.ts'

export const checkPermission = createPermissionChecker(
    'form-permissions/checkPermission.sql',
    'Error checking permission:'
)
