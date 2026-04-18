'use client'

import apiRequestClient from './request'

export async function postTemplate(data: PostTemplateProps): Promise<{ id: string }> {
    return apiRequestClient({ method: 'POST', path: 'templates', data })
}

export async function putTemplate(templateId: string, data: PutTemplateProps) {
    return apiRequestClient({ method: 'PUT', path: `templates/${templateId}`, data })
}

export async function deleteTemplate(templateId: string) {
    return apiRequestClient({ method: 'DELETE', path: `templates/${templateId}` })
}

export async function createFormFromTemplate(templateId: string): Promise<{ id: string }> {
    return apiRequestClient({ method: 'POST', path: `templates/${templateId}/duplicate` })
}

export async function patchTemplateFields(templateId: string, data: PatchTemplateFieldsProps) {
    return apiRequestClient({ method: 'PATCH', path: `templates/${templateId}/fields`, data })
}

export async function postTemplatePermission(templateId: string, data: PostPermissionProps) {
    return apiRequestClient({ method: 'POST', path: `templates/${templateId}/permissions`, data })
}

export async function deleteTemplatePermission(templateId: string, permissionId: string) {
    return apiRequestClient({ method: 'DELETE', path: `templates/${templateId}/permissions/${permissionId}` })
}
