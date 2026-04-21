import cors from '@fastify/cors'
import Fastify from 'fastify'
import fs from 'fs'
import path from 'path'
import config from '#constants'
import apiRoutes from './routes.ts'
import getIndex from './handlers/index/get.ts'
import getFavicon from './handlers/favicon/get.ts'
import { processEmailQueue } from './utils/email/sendSMTP.ts'
import { startInactiveUserCleanup } from './utils/users/inactiveCleanup.ts'

const fastify = Fastify({
    logger: true
})

fastify.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']
})

fastify.decorate('appConfig', config)
fastify.decorate('favicon', fs.readFileSync(path.join(process.cwd(), 'public', 'favicon.ico')))
fastify.register(apiRoutes, { prefix: '/api' })
fastify.get('/', getIndex)
fastify.get('/favicon.ico', getFavicon)

const port = config.PORT

async function main() {
    try {
        await fastify.listen({ port, host: '0.0.0.0' })
        await processEmailQueue()
        await startInactiveUserCleanup()
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}

main()
