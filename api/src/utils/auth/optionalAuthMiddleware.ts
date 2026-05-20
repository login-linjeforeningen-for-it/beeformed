import type { FastifyReply, FastifyRequest } from 'fastify'
import type { AuthUser } from '#utils/auth/authMiddleware.ts'
import checkToken from '#utils/auth/checkToken.ts'
import { touchUserActivity } from '#utils/cleanup/userCleanup.ts'
import { logWarn } from '#utils/logger.ts'

declare module 'fastify' {
    interface FastifyRequest {
        optionalUser?: AuthUser
    }
}

export default async function optionalAuthMiddleware(req: FastifyRequest, _res: FastifyReply) {
    const authHeaderRaw = req.headers['authorization']
    const authHeader = Array.isArray(authHeaderRaw) ? authHeaderRaw[0] : authHeaderRaw
    if (!authHeader?.startsWith('Bearer ')) return

    const tokenResult = await checkToken(req)
    if (!tokenResult.valid || !tokenResult.userInfo?.sub) return

    req.optionalUser = {
        id: tokenResult.userInfo.sub,
        name: tokenResult.userInfo.name,
        email: tokenResult.userInfo.email,
        groups: tokenResult.userInfo.groups || []
    }

    void touchUserActivity(req.optionalUser.id).catch((error: unknown) => {
        logWarn('Failed to update user activity', {
            event: 'user.activity.touch_failed',
            userId: req.optionalUser!.id,
            error
        })
    })
}
