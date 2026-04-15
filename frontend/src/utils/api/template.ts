'use server'

import apiRequest from './apiWrapper'
import { FilterProps } from './types'

export async function getTemplates({search, offset, limit, orderBy, sort}: FilterProps = {}): Promise<GetTemplatesProps> {
    const queryParts = new URLSearchParams()
    if (search)     queryParts.append('search', String(search))
    if (limit)      queryParts.append('limit', String(limit))
    if (offset)     queryParts.append('offset', String(offset))
    if (orderBy)    queryParts.append('order_by', String(orderBy))
    if (sort)       queryParts.append('sort', String(sort))

    return apiRequest({ method: 'GET', path: `templates?${queryParts.toString()}` })
}

export async function getSharedTemplates({search, offset, limit, orderBy, sort}: FilterProps = {}): Promise<GetTemplatesProps> {
    const queryParts = new URLSearchParams()
    if (search)     queryParts.append('search', String(search))
    if (limit)      queryParts.append('limit', String(limit))
    if (offset)     queryParts.append('offset', String(offset))
    if (orderBy)    queryParts.append('order_by', String(orderBy))
    if (sort)       queryParts.append('sort', String(sort))

    return apiRequest({ method: 'GET', path: `templates/shared?${queryParts.toString()}` })
}

export async function getTemplate(templateId: string): Promise<GetTemplateProps> {
    return apiRequest({ method: 'GET', path: `templates/${templateId}` })
}

export async function postTemplate(data: PostTemplateProps): Promise<{id: number}> {
    return apiRequest({ method: 'POST', path: 'templates', data })
}

export async function putTemplate(templateId: number, data: PutTemplateProps) {
    return apiRequest({ method: 'PUT', path: `templates/${templateId}`, data })
}

export async function deleteTemplate(templateId: string) {
    return apiRequest({ method: 'DELETE', path: `templates/${templateId}` })
}

export async function createTemplateFromForm(formId: string): Promise<{ id: number }> {
    return apiRequest({ method: 'POST', path: `forms/${formId}/templates` })
}

export async function createFormFromTemplate(templateId: string): Promise<{ id: number }> {
    return apiRequest({ method: 'POST', path: `templates/${templateId}/duplicate` })
}

export async function getTemplateFields(templateId: string): Promise<GetFieldsProps> {
    return apiRequest({ method: 'GET', path: `templates/${templateId}/fields` })
}

export async function patchTemplateFields(templateId: string, data: PatchTemplateFieldsProps) {
    return apiRequest({ method: 'PATCH', path: `templates/${templateId}/fields`, data })
}

export async function getTemplatePermissions(templateId: string): Promise<GetTemplatePermissionsProps> {
    return apiRequest({ method: 'GET', path: `templates/${templateId}/permissions` })
}

export async function postTemplatePermission(templateId: string, data: PostPermissionProps) {
    return apiRequest({ method: 'POST', path: `templates/${templateId}/permissions`, data })
}

export async function deleteTemplatePermission(templateId: string, permissionId: string) {
    return apiRequest({ method: 'DELETE', path: `templates/${templateId}/permissions/${permissionId}` })
}
