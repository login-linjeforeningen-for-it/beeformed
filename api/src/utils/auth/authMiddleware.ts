import type { FastifyReply, FastifyRequest } from 'fastify'
import checkToken from '#utils/auth/checkToken.ts'

declare module 'fastify' {
    interface FastifyRequest {
        user?: {
            id: string
            name: string
            email: string
            groups: string[]
        }
    }
}

export default async function authMiddleware(req: FastifyRequest, res: FastifyReply) {
    const tokenResult = await checkToken(req, res)

    if (tokenResult.error === 'Internal server error') {
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
}