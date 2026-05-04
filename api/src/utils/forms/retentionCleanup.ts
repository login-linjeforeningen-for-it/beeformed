import run from '#db'
import config from '#constants'
import send from '#utils/email/sendSMTP.ts'
import { logError, logInfo } from '#utils/logger.ts'
import { createFormDeletionWarningTemplate } from '#utils/email/formDeletionTemplate.ts'

const DAILY_INTERVAL_MS = 24 * 60 * 60 * 1000

type FormWarningCandidate = {
    form_id: string
    title: string
    email: string
    name: string | null
    warning_days_remaining: number
}

function buildWarningEmail(candidate: FormWarningCandidate) {
    return createFormDeletionWarningTemplate({
        name: candidate.name,
        formTitle: candidate.title,
        warningDays: candidate.warning_days_remaining,
        actionUrl: `${config.FRONTEND_URL}/form/${candidate.form_id}`
    })
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

async function markWarningEmailSent(formId: string) {
    await run(
        `UPDATE forms
         SET form_deletion_warning_sent_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [formId]
    )
}

export async function sendFormDeletionWarnings() {
    const candidates = await getFormsNeedingWarningEmail()

    for (const candidate of candidates) {
        try {
            const { subject, text, html } = buildWarningEmail(candidate)
            await send({
                to: candidate.email,
                subject,
                text,
                html
            })
            await markWarningEmailSent(candidate.form_id)
        } catch (error) {
            logError('Failed to send form deletion warning email', {
                event: 'form_retention.warning_failed',
                formId: candidate.form_id,
                error
            })
        }
    }

    return candidates.length
}

export async function deleteExpiredForms() {
    const result = await run(
        `DELETE FROM forms
         WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '6 months'`
    )

    return result.rowCount ?? 0
}

export async function startFormRetentionCleanup() {
    async function runCleanup() {
        try {
            const warnedForms = await sendFormDeletionWarnings()
            if (warnedForms > 0) {
                logInfo('Form retention cleanup warned forms', {
                    event: 'form_retention.cleanup.warned',
                    count: warnedForms
                })
            }

            const deletedForms = await deleteExpiredForms()
            if (deletedForms > 0) {
                logInfo('Form retention cleanup deleted forms', {
                    event: 'form_retention.cleanup.deleted',
                    count: deletedForms
                })
            }
        } catch (error) {
            logError('Form-retention cleanup run failed', {
                event: 'form_retention.cleanup.failed',
                error
            })
        }
    }

    await runCleanup()

    const interval = setInterval(() => {
        void runCleanup()
    }, DAILY_INTERVAL_MS)

    interval.unref?.()

    logInfo('Form-retention cleanup scheduled to run daily', {
        event: 'form_retention.cleanup.scheduled'
    })

    return () => {
        clearInterval(interval)
    }
}
