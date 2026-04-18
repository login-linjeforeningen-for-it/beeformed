'use server'

import apiRequest from './request'
import { FilterProps } from '../types'

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

export async function getTemplateFields(templateId: string): Promise<GetFieldsProps> {
    return apiRequest({ method: 'GET', path: `templates/${templateId}/fields` })
}

export async function getTemplatePermissions(templateId: string): Promise<GetTemplatePermissionsProps> {
    return apiRequest({ method: 'GET', path: `templates/${templateId}/permissions` })
}
