'use server'

import apiRequest from './request'
import { FilterProps } from '../types'

export async function getForms({search, offset, limit, orderBy, sort}: FilterProps = {}): Promise<GetFormsProps> {
    const queryParts = new URLSearchParams()
    if (search)     queryParts.append('search', String(search))
    if (limit)      queryParts.append('limit', String(limit))
    if (offset)     queryParts.append('offset', String(offset))
    if (orderBy)    queryParts.append('order_by', String(orderBy))
    if (sort)       queryParts.append('sort', String(sort))

    return apiRequest({ method: 'GET', path: `forms?${queryParts.toString()}` })
}

export async function getSharedForms({search, offset, limit, orderBy, sort}: FilterProps = {}): Promise<GetFormsProps> {
    const queryParts = new URLSearchParams()
    if (search)     queryParts.append('search', String(search))
    if (limit)      queryParts.append('limit', String(limit))
    if (offset)     queryParts.append('offset', String(offset))
    if (orderBy)    queryParts.append('order_by', String(orderBy))
    if (sort)       queryParts.append('sort', String(sort))

    return apiRequest({ method: 'GET', path: `forms/shared?${queryParts.toString()}` })
}

export async function getForm(formId: string): Promise<GetFormProps> {
    return apiRequest({ method: 'GET', path: `forms/${formId}` })
}

export async function getPublicForm(formId: string): Promise<GetPublicFormProps> {
    return apiRequest({ method: 'GET', path: `forms/${formId}/public` })
}
