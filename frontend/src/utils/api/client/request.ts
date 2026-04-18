'use client'

import { getCookie } from 'utilbee/utils'

const apiUrl = process.env.NEXT_PUBLIC_API_URL

type APIRequestProps = {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD'
    path: string
    options?: RequestInit
    data?: object | FormData
}

function extractErrorMessage(payload: unknown): string {
    if (typeof payload === 'string') {
        return payload
    }

    if (payload && typeof payload === 'object') {
        const message = 'message' in payload ? payload.message : undefined
        const error = 'error' in payload ? payload.error : undefined

        if (typeof message === 'string' && message.length > 0) {
            return message
        }

        if (typeof error === 'string' && error.length > 0) {
            return error
        }
    }

    return 'Request failed'
}

export default async function apiRequestClient<T = unknown>({ method, path, options, data }: APIRequestProps): Promise<T> {
    if (!apiUrl) {
        throw new Error('Missing URL')
    }

    const token = getCookie('access_token') || ''
    const isFormData = data instanceof FormData

    const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
    }

    if (data && !isFormData) {
        headers['Content-Type'] = 'application/json'
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)

    const finalOptions: RequestInit = {
        method,
        headers,
        ...options,
        signal: controller.signal,
        body: data ? (isFormData ? data : JSON.stringify(data)) : undefined
    }

    try {
        console.debug(`Making API request: ${method} ${apiUrl}/${path}`, { options: finalOptions })
        const response = await fetch(`${apiUrl}/${path}`, finalOptions)
        clearTimeout(timeoutId)

        if (!response.ok) {
            let payload: unknown
            try {
                payload = await response.json()
            } catch {
                payload = await response.text()
            }
            throw new Error(extractErrorMessage(payload))
        }

        if (response.status === 204) {
            return undefined as T
        }

        const contentType = response.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
            return await response.json() as T
        }

        return await response.text() as T
    } catch (error: unknown) {
        clearTimeout(timeoutId)

        if (error instanceof Error) {
            console.error(`Fetch error: ${error.name} - ${error.message} (${apiUrl}/${path})`)
            if (error.name === 'AbortError') {
                throw new Error('Request timed out after 3 seconds', { cause: error })
            }
            throw error
        }

        console.error('Fetch error:', error)
        throw new Error('Unknown error! Please contact TekKom', { cause: error })
    }
}
