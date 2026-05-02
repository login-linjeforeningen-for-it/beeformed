import config from '#constants'
import { logUtilityError } from '#utils/http/errors.ts'

type CheckTokenResponse = {
    valid: boolean
    userInfo?: {
        sub: string
        name: string
        email: string
        groups?: string[]
    }
    error?: string
}

const tokenCache = new Map<string, { response: CheckTokenResponse; expiresAt: number }>()

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

        const userInfo = await userInfoRes.json()
        const response: CheckTokenResponse = {
            valid: true,
            userInfo: userInfo as any
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
