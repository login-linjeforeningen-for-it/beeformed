import type { FastifyReply, FastifyRequest } from 'fastify'

export function requireGroup(group: string) {
    return async function (req: FastifyRequest, res: FastifyReply) {
        if (!Array.isArray(req.user?.groups) || !req.user.groups.some(g => g.toLowerCase() === group.toLowerCase())) {
            return res.status(403).send({ error: 'Forbidden' })
        }
    }
}
