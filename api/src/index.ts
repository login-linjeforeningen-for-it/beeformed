import cors from '@fastify/cors'
import Fastify from 'fastify'
import fs from 'fs'
import path from 'path'
import config from '#constants'
import apiRoutes from './routes.ts'
import getIndex from './handlers/index/get.ts'
import getFavicon from './handlers/favicon/get.ts'
import { emailQueueScheduler} from './utils/email/sendSMTP.ts'
import { userCleanupScheduler } from './utils/cleanup/userCleanup.ts'
import { formCleanupScheduler } from './utils/cleanup/formCleanup.ts'
import { logError, logInfo } from '#utils/logger.ts'

const fastify = Fastify({
    logger: true
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
fastify.get('/', getIndex)
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
