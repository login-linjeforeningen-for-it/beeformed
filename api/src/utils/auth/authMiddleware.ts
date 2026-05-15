import type { FastifyReply, FastifyRequest, RouteGenericInterface } from 'fastify'
import checkToken from '#utils/auth/checkToken.ts'
import { touchUserActivity } from '#utils/cleanup/userCleanup.ts'
import { logWarn } from '#utils/logger.ts'

export type AuthUser = {
    id: string
    name: string
    email: string
    groups: string[]
}

export type AuthenticatedRequest<T extends RouteGenericInterface = RouteGenericInterface> =
    FastifyRequest<T> & { user: AuthUser }

export type AuthenticatedHandler<T extends RouteGenericInterface = RouteGenericInterface> =
    (req: AuthenticatedRequest<T>, res: FastifyReply) => unknown | Promise<unknown>

declare module 'fastify' {
    interface FastifyRequest {
        user?: AuthUser
    }
}

export function withAuthenticatedUser<T extends RouteGenericInterface = RouteGenericInterface>(
    handler: AuthenticatedHandler<T>
) {
    return async (req: FastifyRequest<T>, res: FastifyReply) => {
        if (!req.user) {
            res.status(401).send({ error: 'Unauthorized' })
            return
        }

        return handler(req as AuthenticatedRequest<T>, res)
    }
}

export default async function authMiddleware(req: FastifyRequest, res: FastifyReply) {
    const tokenResult = await checkToken(req)

    if (tokenResult.errorCode === 'INTERNAL') {
        res.status(500).send({ error: 'Internal server error' })
        return
    }

    if (!tokenResult.valid || !tokenResult.userInfo || !tokenResult.userInfo.sub) {
        res.status(401).send({ error: tokenResult.error || 'Invalid user information' })
        return
    }

    req.user = {
        id: tokenResult.userInfo.sub,
        name: tokenResult.userInfo.name,
        email: tokenResult.userInfo.email,
        groups: tokenResult.userInfo.groups || []
    }

    void touchUserActivity(req.user.id).catch((error: unknown) => {
        logWarn('Failed to update user activity', {
            event: 'user.activity.touch_failed',
            userId: req.user?.id,
            error
        })
    })
}