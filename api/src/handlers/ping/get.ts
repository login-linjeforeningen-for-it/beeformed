import type { FastifyReply, FastifyRequest } from 'fastify'

export default async function getPing(_req: FastifyRequest, res: FastifyReply) {
    return res.send({ message: 'pong' })
}
