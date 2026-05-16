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
import { emailQueueScheduler} from './utils/email/sendSMTP.ts'
import { userCleanupScheduler } from './utils/cleanup/userCleanup.ts'
import { formCleanupScheduler } from './utils/cleanup/formCleanup.ts'
import { logError, logInfo } from '#utils/logger.ts'

const fastify = Fastify({
    logger: true
})

fastify.setValidatorCompiler(validatorCompiler)
fastify.setSerializerCompiler(serializerCompiler)

fastify.setErrorHandler((error, _req, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
        return reply.status(400).send({
            error: error.validation
                .map(issue => issue.message)
                .join('; ')
        })
    }

    const statusCode = (error as { statusCode?: number }).statusCode
    if (statusCode && statusCode < 500) {
        return reply.status(statusCode).send({ error: (error as Error).message })
    }

    logError('Unhandled error', { event: 'http.internal_error', error })
    return reply.status(500).send({ error: 'Internal server error' })
})

fastify.register(cors, {
    origin: /^https:\/\/(?:.+\.)?login\.no$/,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']
})

fastify.decorate('appConfig', config)
fastify.decorate('favicon', fs.readFileSync(path.join(process.cwd(), 'public', 'favicon.ico')))
fastify.register(apiRoutes, { prefix: '/api' })
fastify.register(userCleanupScheduler)
fastify.register(formCleanupScheduler)
fastify.register(emailQueueScheduler)
fastify.get('/favicon.ico', getFavicon)

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
