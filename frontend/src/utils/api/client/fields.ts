'use client'

import apiRequestClient from './request'

export async function patchFields(formId: string, data: PatchFieldsProps) {
    return apiRequestClient({ method: 'PATCH', path: `forms/${formId}/fields`, data })
}
