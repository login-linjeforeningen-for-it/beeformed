import type { FastifyReply, FastifyRequest } from 'fastify'

export default async function getIndex(req: FastifyRequest, res: FastifyReply) {
    if (!req.optionalUser) {
        res.send('BeeFormed API.\n\nLog in for more information.')
        return
    }

    const routes = req.server.printRoutes({ commonPrefix: false })
    res.send(`BeeFormed API.\n\nValid endpoints are:\n\n${routes}`)
}
