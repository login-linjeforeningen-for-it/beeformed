import cors from '@fastify/cors'
import Fastify from 'fastify'
import apiRoutes from './routes.ts'
import fs from 'fs'
import path from 'path'

import getIndex from './handlers/index/getIndex.ts'
import getFavicon from './handlers/favicon/getFavicon.ts'
import { processEmailQueue } from './utils/sendSMTP.ts'

const fastify = Fastify({
    logger: true
})

fastify.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD']
})

const port = Number(process.env.PORT) || 8080

fastify.decorate('favicon', fs.readFileSync(path.join(process.cwd(), 'public', 'favicon.ico')))
fastify.register(apiRoutes, { prefix: '/api' })
fastify.get('/', getIndex)
fastify.get('/favicon.ico', getFavicon)

async function main() {
    try {
        await fastify.listen({ port, host: '0.0.0.0' })
        await processEmailQueue()
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}

main()
