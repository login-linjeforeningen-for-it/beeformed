import run from '#db'
import { sendTypedEmail, QueuedEmailType, EmailPayloadMap } from '#utils/email/sendSMTP.ts'
import { logError } from '#utils/logger.ts'

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
        emailType: QueuedEmailType
        buildPayload: (candidate: T) => object
        markSent: (candidate: T) => Promise<void>
        logContext?: (candidate: T) => Record<string, unknown>
    }
) {
    let sentCount = 0
    for (const candidate of candidates) {
        try {
            const payload = options.buildPayload(candidate)
            await sendTypedEmail(options.emailType, candidate.email, payload as EmailPayloadMap[QueuedEmailType])
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

