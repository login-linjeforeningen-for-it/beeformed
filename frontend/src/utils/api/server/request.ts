import config from '@config'
import { cookies } from 'next/headers'

const url = config.url.api

type APIRequestProps = {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD'
    path: string
    options?: RequestInit
    data?: object
}

export default async function apiRequest<T = unknown>({ method, path, options, data }: APIRequestProps): Promise<T> {
    const Cookies = await cookies()
    const token = Cookies.get('access_token')?.value || ''

    const isFormData = data instanceof FormData

    const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
    }

    if (data && !isFormData) {
        headers['Content-Type'] = 'application/json'
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)

    const finalOptions = {
        method,
        headers,
        ...options,
        signal: controller.signal,
        body: data ? isFormData ? data : JSON.stringify(data) : undefined
    }

    try {
        const response = await fetch(`${url}/${path}`, finalOptions)
        clearTimeout(timeoutId)

        if (!response.ok) {
            const text = await response.json()
            const message = text.message || text.error || text
            throw new Error(message)
        }

        const data = await response.json()
        return data

    } catch (error: unknown) {
        clearTimeout(timeoutId)

        if (error instanceof Error) {
            console.error(`Fetch error: ${error.name} - ${error.message} (${url}/${path})`)
            if (error.name === 'AbortError') {
                throw new Error('Request timed out after 3 seconds', { cause: error })
            }
            throw error
        } else {
            console.error('Fetch error: ', error)
            throw new Error('Unknown error! Please contact TekKom', { cause: error })
        }
    }
}
