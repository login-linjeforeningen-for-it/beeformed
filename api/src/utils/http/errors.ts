import type { FastifyReply } from 'fastify'

export function isInvalidOrderByError(error: unknown): error is Error {
    return error instanceof Error && error.message === 'Invalid order_by parameter'
}

export function sendInternalServerError(reply: FastifyReply, context: string, error: unknown) {
    reply.log.error({ err: error }, context)
    return reply.status(500).send({ error: 'Internal server error' })
}

export function logUtilityError(context: string, error?: unknown) {
    if (error === undefined) {
        console.error(context)
        return
    }

    console.error(context, error)
}
