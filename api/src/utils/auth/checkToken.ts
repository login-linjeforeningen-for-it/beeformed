import type { FastifyRequest } from 'fastify'
import config from '#constants'
import { logError, logWarn } from '#utils/logger.ts'

type UserInfoClaims = {
    sub: string
    name: string
    email: string
    groups?: string[]
}

export type CheckTokenErrorCode = 'INTERNAL' | 'UNAUTHORIZED'

type CheckTokenResponse = {
    valid: boolean
    userInfo?: UserInfoClaims
    error?: string
    errorCode?: CheckTokenErrorCode
}

const MAX_CACHE_SIZE = 500
const tokenCache = new Map<string, { response: CheckTokenResponse; expiresAt: number }>()

function parseUserInfoClaims(data: unknown): UserInfoClaims | null {
    if (data === null || typeof data !== 'object') {
        return null
    }

    const o = data as Record<string, unknown>
    if (typeof o.sub !== 'string' || !o.sub.trim()) {
        return null
    }

    if (typeof o.email !== 'string' || !o.email.trim()) {
        return null
    }

    if (typeof o.name !== 'string') {
        return null
    }

    let groups: string[] | undefined
    if (o.groups !== undefined && o.groups !== null) {
        if (!Array.isArray(o.groups)) {
            return null
        }
        if (!o.groups.every((item): item is string => typeof item === 'string')) {
            return null
        }
        groups = [...o.groups]
    }

    return {
        sub: o.sub.trim(),
        name: o.name,
        email: o.email.trim(),
        groups
    }
}

export default async function checkToken(req: FastifyRequest): Promise<CheckTokenResponse> {
    const { USERINFO_URL, CACHE_TTL } = config
    const authHeaderRaw = req.headers['authorization']
    const authHeader = Array.isArray(authHeaderRaw) ? authHeaderRaw[0] : authHeaderRaw

    if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
        return {
            valid: false,
            errorCode: 'UNAUTHORIZED',
            error: 'Missing or invalid Authorization header'
        }
    }

    const token = authHeader.split(' ')[1]

    const cached = tokenCache.get(token)
    if (cached && cached.expiresAt > Date.now()) {
        tokenCache.delete(token)
        tokenCache.set(token, cached)
        return cached.response
    }

    try {
        const userInfoRes = await fetch(USERINFO_URL, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        if (!userInfoRes.ok) {
            return {
                valid: false,
                errorCode: 'UNAUTHORIZED',
                error: 'Unauthorized'
            }
        }

        const rawBody: unknown = await userInfoRes.json()
        const userInfo = parseUserInfoClaims(rawBody)
        if (!userInfo) {
            logWarn('Token check: userinfo payload missing or invalid sub, email, name, or groups shape', {
                event: 'auth.userinfo.invalid'
            })
            return {
                valid: false,
                errorCode: 'UNAUTHORIZED',
                error: 'Unauthorized'
            }
        }

        const response: CheckTokenResponse = {
            valid: true,
            userInfo
        }

        const isRefresh = tokenCache.has(token)
        if (isRefresh) tokenCache.delete(token)

        if (tokenCache.size >= MAX_CACHE_SIZE) {
            const oldestKey = tokenCache.keys().next().value
            if (oldestKey !== undefined) tokenCache.delete(oldestKey)
        }
        tokenCache.set(token, {
            response,
            expiresAt: Date.now() + CACHE_TTL
        })

        return response
    } catch (err) {
        logError('Token check error', {
            event: 'auth.token_check_failed',
            error: err
        })
        return {
            valid: false,
            errorCode: 'INTERNAL',
            error: 'Internal server error'
        }
    }
}
