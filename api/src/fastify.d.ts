import 'fastify'
import type config from '#constants'

type AppConfig = typeof config

declare module 'fastify' {
    interface FastifyInstance {
        favicon: Buffer
        appConfig: AppConfig
    }
}
