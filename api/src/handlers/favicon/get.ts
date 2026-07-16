import type { FastifyReply, FastifyRequest } from 'fastify'

declare module 'fastify' {
    interface FastifyInstance {
        favicon: Buffer
    }
}

export default async function getFavicon(req: FastifyRequest, res: FastifyReply) {
    return res.type('image/x-icon').send(req.server.favicon)
}
