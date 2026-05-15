import type { FastifyInstance } from 'fastify'
import run from '#db'
import config from '#constants'
import { logError, logInfo } from '#utils/logger.ts'
import { markWarningSent, deleteExpiredRecords, sendWarnings } from './baseCleanup.ts'

type FormWarningCandidate = {
    form_id: string
    title: string
    email: string
    name: string | null
    warning_days_remaining: number
}

async function getFormsNeedingWarningEmail() {
    const result = await run(
        `SELECT
            forms.id AS form_id,
            forms.title,
            users.email,
            users.name,
            GREATEST(
                1,
                CEIL(EXTRACT(EPOCH FROM ((forms.created_at + INTERVAL '6 months') - CURRENT_TIMESTAMP)) / 86400.0)
            )::INT AS warning_days_remaining
         FROM forms
         JOIN users ON users.user_id = forms.user_id
         WHERE forms.created_at < CURRENT_TIMESTAMP - (INTERVAL '6 months' - INTERVAL '14 days')
           AND forms.created_at >= CURRENT_TIMESTAMP - INTERVAL '6 months'
           AND forms.form_deletion_warning_sent_at IS NULL`
    )

    return result.rows as FormWarningCandidate[]
}

async function runFormCleanup() {
    try {
        const candidates = await getFormsNeedingWarningEmail()
        const warned = await sendWarnings(candidates, {
            name: 'form deletion',
            logEventPrefix: 'form_retention',
            emailType: 'form_deletion_warning',
            buildPayload: (c) => ({
                name: c.name,
                formTitle: c.title,
                warningDays: c.warning_days_remaining,
                actionUrl: `${config.FRONTEND_URL}/form/${c.form_id}`
            }),
            markSent: (c) => markWarningSent('forms', 'id', c.form_id, 'form_deletion_warning_sent_at'),
            logContext: (c) => ({ formId: c.form_id })
        })
        const deleted = await deleteExpiredRecords('forms', 'created_at', '6 months')
        if (warned > 0) logInfo('Form retention cleanup warned users', { event: 'form_retention.cleanup.warned', count: warned })
        if (deleted > 0) logInfo('Form retention cleanup deleted forms', { event: 'form_retention.cleanup.deleted', count: deleted })
    } catch (error) {
        logError('Form retention cleanup failed', { event: 'form_retention.cleanup.failed', error })
    }
}

export async function formCleanupScheduler(_fastify: FastifyInstance) {
    await runFormCleanup()
    Bun.cron('0 0 * * *', runFormCleanup)
}
