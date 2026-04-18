'use server'

import apiRequest from './request'

export async function getFields(formId: string): Promise<GetFieldsProps> {
    return apiRequest({ method: 'GET', path: `forms/${formId}/fields` })
}
