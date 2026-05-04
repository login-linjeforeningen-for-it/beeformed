export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type LogMetadata = {
    event?: string
    requestId?: string
    method?: string
    path?: string
    status?: number
    durationMs?: number
    userId?: string
    error?: unknown
    [key: string]: unknown
}

type SerializedError = {
    name?: string
    message?: string
    stack?: string
    cause?: unknown
}

const RESERVED_KEYS = new Set(['timestamp', 'level', 'msg', 'error'])

function serializeError(error: unknown): SerializedError {
    if (error instanceof Error) {
        const serialized: SerializedError = {
            name: error.name,
            message: error.message,
            stack: error.stack
        }
        if ('cause' in error && error.cause !== undefined) {
            serialized.cause = error.cause
        }
        return serialized
    }

    if (typeof error === 'object' && error !== null) {
        const err = error as { name?: unknown; message?: unknown; stack?: unknown; cause?: unknown }
        return {
            name: typeof err.name === 'string' ? err.name : undefined,
            message: typeof err.message === 'string' ? err.message : undefined,
            stack: typeof err.stack === 'string' ? err.stack : undefined,
            cause: err.cause
        }
    }

    if (typeof error === 'string') {
        return { message: error }
    }

    return { message: String(error) }
}

function safeStringify(value: unknown): string {
    const seen = new WeakSet()
    const serialized = JSON.stringify(value, (_key, val) => {
        if (typeof val === 'bigint') {
            return val.toString()
        }
        if (val instanceof Error) {
            return serializeError(val)
        }
        if (typeof val === 'object' && val !== null) {
            if (seen.has(val)) {
                return '[Circular]'
            }
            seen.add(val)
        }
        return val
    })

    return serialized ?? '{}'
}

export function log(level: LogLevel, msg: string, meta: LogMetadata = {}): void {
    const { error, ...rest } = meta

    const entry: Record<string, unknown> = {
        timestamp: new Date().toISOString(),
        level,
        msg
    }

    for (const [key, value] of Object.entries(rest)) {
        if (value === undefined || RESERVED_KEYS.has(key)) {
            continue
        }
        entry[key] = value
    }

    if (error !== undefined) {
        entry.error = serializeError(error)
    }

    process.stdout.write(`${safeStringify(entry)}\n`)
}

export function logDebug(msg: string, meta?: LogMetadata): void {
    log('debug', msg, meta)
}

export function logInfo(msg: string, meta?: LogMetadata): void {
    log('info', msg, meta)
}

export function logWarn(msg: string, meta?: LogMetadata): void {
    log('warn', msg, meta)
}

export function logError(msg: string, meta?: LogMetadata): void {
    log('error', msg, meta)
}
