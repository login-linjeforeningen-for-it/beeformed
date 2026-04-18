'use client'

import apiRequestClient from './request'

export async function postPermission(formId: string, data: PostPermissionProps) {
    return apiRequestClient({ method: 'POST', path: `forms/${formId}/permissions`, data })
}

export async function deletePermission(formId: string, permissionId: string) {
    return apiRequestClient({ method: 'DELETE', path: `forms/${formId}/permissions/${permissionId}` })
}
