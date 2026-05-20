'use client'

import apiRequestClient from './request'

export async function postForm(data: PostFormProps): Promise<{ id: string }> {
    return apiRequestClient({ method: 'POST', path: 'forms', data })
}

export async function putForm(formId: string, data: PutFormProps) {
    return apiRequestClient({ method: 'PUT', path: `forms/${formId}`, data })
}

export async function deleteForm(formId: string) {
    return apiRequestClient({ method: 'DELETE', path: `forms/${formId}` })
}

export async function duplicateForm(formId: string, data: { title: string; slug: string; published_at: string; expires_at: string }): Promise<{ id: string }> {
    return apiRequestClient({ method: 'POST', path: `forms/${formId}/duplicate`, data })
}

export async function createTemplateFromForm(formId: string, data: { title: string; slug: string }): Promise<{ id: string }> {
    return apiRequestClient({ method: 'POST', path: `forms/${formId}/templates`, data })
}
