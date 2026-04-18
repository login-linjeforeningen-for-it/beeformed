import run from '#db'
import config from '#constants'
import send from '#utils/email/sendSMTP.ts'
import { logUtilityError } from '#utils/http/errors.ts'
import { createAccountDeletionWarningTemplate } from '../email/accountDeletionTemplate.ts'

const DAILY_INTERVAL_MS = 24 * 60 * 60 * 1000

type InactiveWarningCandidate = {
    user_id: string
    email: string
    name: string | null
    warning_days_remaining: number
}

function buildWarningEmail(candidate: InactiveWarningCandidate) {
    return createAccountDeletionWarningTemplate({
        name: candidate.name,
        warningDays: candidate.warning_days_remaining,
        actionUrl: `${config.FRONTEND_URL}/profile`
    })
}

async function getUsersNeedingWarningEmail() {
    const result = await run(
        `SELECT
            user_id,
            email,
            name,
            GREATEST(
                1,
                CEIL(EXTRACT(EPOCH FROM ((last_active_at + INTERVAL '6 months') - CURRENT_TIMESTAMP)) / 86400.0)
            )::INT AS warning_days_remaining
         FROM users
         WHERE last_active_at < CURRENT_TIMESTAMP - (INTERVAL '6 months' - INTERVAL '14 days')
           AND last_active_at >= CURRENT_TIMESTAMP - INTERVAL '6 months'
           AND inactivity_warning_sent_at IS NULL`
    )

    return result.rows as InactiveWarningCandidate[]
}

async function markWarningEmailSent(userId: string) {
    await run(
        `UPDATE users
         SET inactivity_warning_sent_at = CURRENT_TIMESTAMP
         WHERE user_id = $1`,
        [userId]
    )
}

export async function sendInactiveUserWarnings() {
    const candidates = await getUsersNeedingWarningEmail()

    for (const candidate of candidates) {
        try {
            const { subject, text, html } = buildWarningEmail(candidate)
            await send({
                to: candidate.email,
                subject,
                text,
                html
            })
            await markWarningEmailSent(candidate.user_id)
        } catch (error) {
            logUtilityError(
                `[inactive-user-cleanup] Failed to send inactivity warning email for user ${candidate.user_id}`,
                error
            )
        }
    }

    return candidates.length
}

export async function touchUserActivity(userId: string) {
    if (!userId) {
        return
    }

    await run(
        `UPDATE users
         SET last_active_at = CURRENT_TIMESTAMP,
             inactivity_warning_sent_at = NULL
         WHERE user_id = $1
           AND (last_active_at IS NULL OR last_active_at < CURRENT_TIMESTAMP - INTERVAL '24 hours')`,
        [userId]
    )
}

export async function deleteInactiveUsers() {
    const result = await run(
        `DELETE FROM users
         WHERE last_active_at < CURRENT_TIMESTAMP - INTERVAL '6 months'`
    )

    return result.rowCount ?? 0
}

export async function startInactiveUserCleanup() {
    async function runCleanup() {
        try {
            const warnedUsers = await sendInactiveUserWarnings()
            if (warnedUsers > 0) {
                logUtilityError(`[inactive-user-cleanup] Daily cleanup warned ${warnedUsers} user(s) about upcoming deletion`)
            }

            const deletedUsers = await deleteInactiveUsers()
            if (deletedUsers > 0) {
                logUtilityError(`[inactive-user-cleanup] Daily cleanup deleted ${deletedUsers} inactive user(s)`)
            }
        } catch (error) {
            logUtilityError('[inactive-user-cleanup] Failed inactive-user cleanup run', error)
        }
    }

    await runCleanup()

    const interval = setInterval(() => {
        void runCleanup()
    }, DAILY_INTERVAL_MS)

    interval.unref?.()

    logUtilityError('[inactive-user-cleanup] Inactive-user cleanup scheduled to run daily')

    return () => {
        clearInterval(interval)
    }
}
