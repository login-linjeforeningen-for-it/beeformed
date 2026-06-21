import pino from 'pino'

export const logger = pino({
    base: undefined,
    timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
    messageKey: 'msg',
    formatters: { level: (label) => ({ level: label }) },
    serializers: { error: pino.stdSerializers.err }
})

type LogMetadata = Record<string, unknown> & { error?: unknown }

export function logInfo(msg: string, meta: LogMetadata = {}): void {
    logger.info(meta, msg)
}

export function logWarn(msg: string, meta: LogMetadata = {}): void {
    logger.warn(meta, msg)
}

export function logError(msg: string, meta: LogMetadata = {}): void {
    logger.error(meta, msg)
}
