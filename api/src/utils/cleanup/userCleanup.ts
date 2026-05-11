import run from '#db'
import config from '#constants'
import { createAccountDeletionWarningTemplate } from '../email/accountDeletionTemplate.ts'
import { startCleanupTask, markWarningSent, deleteExpiredRecords, sendWarnings } from './baseCleanup.ts'

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

export async function startUserCleanup() {
    return startCleanupTask({
        name: 'Inactive user',
        runCleanup: async () => {
            const candidates = await getUsersNeedingWarningEmail()
            
            const warned = await sendWarnings(candidates, {
                name: 'inactivity',
                logEventPrefix: 'inactive_user',
                buildEmail: buildWarningEmail,
                markSent: (c) => markWarningSent('users', 'user_id', c.user_id, 'inactivity_warning_sent_at'),
                logContext: (c) => ({ userId: c.user_id })
            })
            
            const deleted = await deleteExpiredRecords('users', 'last_active_at', '6 months')
            
            return { warned, deleted }
        }
    })
}

export async function touchUserActivity(userId: string) {
    if (!userId) return

    await run(
        `UPDATE users
         SET last_active_at = CURRENT_TIMESTAMP,
             inactivity_warning_sent_at = NULL
         WHERE user_id = $1
           AND (last_active_at IS NULL OR last_active_at < CURRENT_TIMESTAMP - INTERVAL '24 hours')`,
        [userId]
    )
}