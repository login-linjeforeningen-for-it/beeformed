'use server'

import apiRequest from './request'

export async function getPermissions(formId: string): Promise<GetPermissionsProps> {
    return apiRequest({ method: 'GET', path: `forms/${formId}/permissions` })
}
