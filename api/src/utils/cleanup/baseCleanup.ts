import run from '#db'
import send from '#utils/email/sendSMTP.ts'
import { logError, logInfo } from '#utils/logger.ts'

const DAILY_INTERVAL_MS = 24 * 60 * 60 * 1000

function assertSafeIdentifier(value: string, label: string) {
    if (!/^[a-z_]+$/.test(value)) {
        throw new Error(`Unsafe SQL identifier for ${label}`)
    }
}

function normalizeInterval(value: string) {
    const normalized = value.trim().toLowerCase()
    if (!/^\d+\s+(minute|minutes|hour|hours|day|days|week|weeks|month|months|year|years)$/.test(normalized)) {
        throw new Error('Unsafe SQL interval value')
    }
    return normalized
}

export async function sendWarnings<T extends { email: string }>(
    candidates: T[],
    options: {
        name: string
        logEventPrefix: string
        buildEmail: (candidate: T) => { subject: string; text: string; html: string }
        markSent: (candidate: T) => Promise<void>
        logContext?: (candidate: T) => Record<string, unknown>
    }
) {
    let sentCount = 0
    for (const candidate of candidates) {
        try {
            const { subject, text, html } = options.buildEmail(candidate)
            await send({ to: candidate.email, subject, text, html })
            await options.markSent(candidate)
            sentCount += 1
        } catch (error) {
            const logContext = options.logContext?.(candidate)
            logError(`Failed to send ${options.name} warning email`, {
                event: `${options.logEventPrefix}.warning_failed`,
                error,
                ...(logContext ?? {})
            })
        }
    }
    return sentCount
}

export async function markWarningSent(tableName: string, idColumn: string, idValue: string, column: string) {
    assertSafeIdentifier(tableName, 'tableName')
    assertSafeIdentifier(idColumn, 'idColumn')
    assertSafeIdentifier(column, 'column')
    await run(
        `UPDATE ${tableName}
         SET ${column} = CURRENT_TIMESTAMP
         WHERE ${idColumn} = $1`,
        [idValue]
    )
}

export async function deleteExpiredRecords(tableName: string, dateColumn: string, interval: string = '6 months') {
    assertSafeIdentifier(tableName, 'tableName')
    assertSafeIdentifier(dateColumn, 'dateColumn')
    const safeInterval = normalizeInterval(interval)
    const result = await run(
        `DELETE FROM ${tableName}
         WHERE ${dateColumn} < CURRENT_TIMESTAMP - INTERVAL '${safeInterval}'`
    )

    return result.rowCount ?? 0
}

export async function startCleanupTask({
    name,
    runCleanup
}: {
    name: string
    runCleanup: () => Promise<{ warned?: number; deleted?: number }>
}) {
    const eventPrefix = name.toLowerCase().replace(/\s+/g, '_')

    async function execute() {
        try {
            const { warned, deleted } = await runCleanup()

            if (warned && warned > 0) {
                logInfo(`${name} cleanup warned items`, {
                    event: `${eventPrefix}.cleanup.warned`,
                    count: warned
                })
            }

            if (deleted && deleted > 0) {
                logInfo(`${name} cleanup deleted items`, {
                    event: `${eventPrefix}.cleanup.deleted`,
                    count: deleted
                })
            }
        } catch (error) {
            logError(`${name} cleanup run failed`, {
                event: `${eventPrefix}.cleanup.failed`,
                error
            })
        }
    }

    // Run immediately on start
    await execute()

    const interval = setInterval(() => {
        void execute()
    }, DAILY_INTERVAL_MS)

    interval.unref?.()

    logInfo(`${name} cleanup scheduled to run daily`, {
        event: `${eventPrefix}.cleanup.scheduled`
    })

    return () => {
        clearInterval(interval)
    }
}
