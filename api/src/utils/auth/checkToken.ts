import config from '#constants'
import { logUtilityError } from '#utils/http/errors.ts'

type UserInfoClaims = {
    sub: string
    name: string
    email: string
    groups?: string[]
}

type CheckTokenResponse = {
    valid: boolean
    userInfo?: UserInfoClaims
    error?: string
}

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

export default async function checkToken(req: Request): Promise<CheckTokenResponse> {
    const { USERINFO_URL, CACHE_TTL } = config
    const authHeader = req.headers.get('authorization')

    if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
        return {
            valid: false,
            error: 'Missing or invalid Authorization header'
        }
    }

    const token = authHeader.split(' ')[1]

    const cached = tokenCache.get(token)
    if (cached && cached.expiresAt > Date.now()) {
        return cached.response
    }

    try {
        const userInfoRes = await fetch(USERINFO_URL, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        if (!userInfoRes.ok) {
            const errorResponse: CheckTokenResponse = {
                valid: false,
                error: 'Unauthorized'
            }
            return errorResponse
        }

        const rawBody: unknown = await userInfoRes.json()
        const userInfo = parseUserInfoClaims(rawBody)
        if (!userInfo) {
            logUtilityError('Token check: userinfo payload missing or invalid sub, email, name, or groups shape')
            return {
                valid: false,
                error: 'Unauthorized'
            }
        }

        const response: CheckTokenResponse = {
            valid: true,
            userInfo
        }

        tokenCache.set(token, {
            response,
            expiresAt: Date.now() + CACHE_TTL
        })

        return response
    } catch (err) {
        logUtilityError('Token check error:', err)
        return {
            valid: false,
            error: 'Internal server error'
        }
    }
}
