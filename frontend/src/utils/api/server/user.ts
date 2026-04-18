'use server'

import apiRequest from './request'

export async function getUser() {
    return apiRequest({ method: 'GET', path: 'users' })
}
