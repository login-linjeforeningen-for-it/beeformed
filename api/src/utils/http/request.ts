import type { FastifyReply, FastifyRequest } from 'fastify'

type RequireRouteParamOptions = {
    keys?: string[]
    error: string
}

export function getRouteParam(req: FastifyRequest, keys: string[]): string | undefined {
    const params = req.params as Record<string, string | undefined>
    return keys.map((key) => params[key]).find((value) => Boolean(value))
}

export function requireRouteParam(
    req: FastifyRequest,
    reply: FastifyReply,
    options: RequireRouteParamOptions
): string | null {
    const value = getRouteParam(req, options.keys ?? ['id'])
    if (!value) {
        reply.status(400).send({ error: options.error })
        return null
    }

    return value
}
