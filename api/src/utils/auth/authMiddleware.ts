import type { BunRequest } from 'bun'
import checkToken from '#utils/auth/checkToken.ts'
import { touchUserActivity } from '#utils/users/inactiveCleanup.ts'

export type AuthUser = {
    id: string
    name: string
    email: string
    groups: string[]
}

export type AuthRequest<T extends string = string> = BunRequest<T> & { user: AuthUser }

export function withAuth<T extends string = string>(handler: (req: AuthRequest<T>) => Response | Promise<Response>) {
    return async (req: BunRequest<T>): Promise<Response> => {
        const tokenResult = await checkToken(req as Request)

        if (tokenResult.error === 'Internal server error') {
            return Response.json({ error: 'Internal server error' }, { status: 500 })
        }

        if (!tokenResult.valid || !tokenResult.userInfo || !tokenResult.userInfo.sub) {
            return Response.json({ error: tokenResult.error || 'Invalid user information' }, { status: 401 })
        }

        const authReq = req as unknown as AuthRequest<T>
        authReq.user = {
            id: tokenResult.userInfo.sub,
            name: tokenResult.userInfo.name,
            email: tokenResult.userInfo.email,
            groups: tokenResult.userInfo.groups || []
        }

        void touchUserActivity(authReq.user.id).catch((error: unknown) => {
            console.warn('Failed to update user activity', error, authReq.user?.id)
        })

        return handler(authReq)
    }
}