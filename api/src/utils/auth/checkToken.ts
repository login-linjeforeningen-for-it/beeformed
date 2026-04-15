import type { FastifyReply, FastifyRequest } from 'fastify'

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

export default async function checkToken( req: FastifyRequest, res: FastifyReply ): Promise<CheckTokenResponse> {
    const { USERINFO_URL } = req.server.appConfig
    const authHeaderRaw = req.headers['authorization']
    const authHeader = Array.isArray(authHeaderRaw) ? authHeaderRaw[0] : authHeaderRaw

    if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
        return {
            valid: false,
            error: 'Missing or invalid Authorization header'
        }
    }

    const token = authHeader.split(' ')[1]

    try {
        const userInfoRes = await fetch(USERINFO_URL, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        if (!userInfoRes.ok) {
            return {
                valid: false,
                error: 'Unauthorized'
            }
        }

        const userInfo = await userInfoRes.json()

        return {
            valid: true,
            userInfo: userInfo
        }
    } catch (err) {
        res.log.error(err)
        return {
            valid: false,
            error: 'Internal server error'
        }
    }
}
