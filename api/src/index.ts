import cors from '@fastify/cors'
import Fastify from 'fastify'
import {
    serializerCompiler,
    validatorCompiler,
    hasZodFastifySchemaValidationErrors
} from 'fastify-type-provider-zod'
import fs from 'fs'
import path from 'path'
import config from '#constants'
import apiRoutes from './routes.ts'
import getFavicon from './handlers/favicon/get.ts'
import { emailQueueScheduler } from './utils/email/sendSMTP.ts'
import { userCleanupScheduler } from './utils/cleanup/userCleanup.ts'
import { formCleanupScheduler } from './utils/cleanup/formCleanup.ts'
import { logError, logInfo } from '#utils/logger.ts'
import { HttpError } from '#db'
import getIndex from './handlers/index/get.ts'

const GENERIC_CLIENT_ERROR_MESSAGES: Record<number, string> = {
    400: 'Bad request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not found',
    405: 'Method not allowed',
    406: 'Not acceptable',
    409: 'Conflict',
    413: 'Payload too large',
    415: 'Unsupported media type',
    422: 'Unprocessable entity',
    429: 'Too many requests'
}

const fastify = Fastify({
    logger: true
})

fastify.setValidatorCompiler(validatorCompiler)
fastify.setSerializerCompiler(serializerCompiler)

fastify.setErrorHandler((error, req, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
        return reply.status(400).send({
            error: error.validation
                .map(issue => issue.message)
                .join('; ')
        })
    }

    const pgError = error as { code?: string; constraint?: string }
    if (pgError.code === '23505') {
        if (pgError.constraint === 'forms_slug_key' || pgError.constraint === 'form_templates_slug_key') {
            return reply.status(409).send({ error: 'Slug is already taken' })
        }
    }

    if (error instanceof HttpError) {
        return reply.status(error.statusCode).send({ error: error.message })
    }

    const statusCode = (error as { statusCode?: number }).statusCode
    if (statusCode && statusCode >= 400 && statusCode < 500) {
        return reply.status(statusCode).send({
            error: GENERIC_CLIENT_ERROR_MESSAGES[statusCode] ?? 'Client error'
        })
    }

    logError('Unhandled error', { event: 'http.internal_error', requestId: req.id, error })
    return reply.status(500).send({ error: 'Internal server error' })
})

fastify.register(cors, {
    origin: [/^https:\/\/(?:.+\.)?login\.no$/, /^http:\/\/localhost:(8700|3000)$/],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']
})

fastify.decorate('appConfig', config)
fastify.decorate('favicon', fs.readFileSync(path.join(process.cwd(), 'public', 'favicon.ico')))
fastify.register(apiRoutes, { prefix: '/api' })
fastify.register(userCleanupScheduler)
fastify.register(formCleanupScheduler)
fastify.register(emailQueueScheduler)
fastify.get('/favicon.ico', getFavicon)
fastify.get('/', getIndex)

const port = config.PORT

async function main() {
    try {
        await fastify.listen({ port, host: '0.0.0.0' })
        logInfo('Server listening', { event: 'server.start', port })
    } catch (err) {
        logError('Server failed to start', { event: 'server.start_failed', error: err })
        fastify.log.error(err)
        process.exit(1)
    }
}

main()
