'use client'

import apiRequestClient from './request'

export async function deleteUser() {
    return apiRequestClient({ method: 'DELETE', path: 'users' })
}
