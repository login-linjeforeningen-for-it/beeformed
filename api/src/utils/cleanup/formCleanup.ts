import run from '#db'
import config from '#constants'
import { createFormDeletionWarningTemplate } from '#utils/email/formDeletionTemplate.ts'
import { startCleanupTask, markWarningSent, deleteExpiredRecords, sendWarnings } from './baseCleanup.ts'

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

export async function startFormCleanup() {
    return startCleanupTask({
        name: 'Form retention',
        runCleanup: async () => {
            const candidates = await getFormsNeedingWarningEmail()
            
            const warned = await sendWarnings(candidates, {
                name: 'form deletion',
                logEventPrefix: 'form_retention',
                buildEmail: buildWarningEmail,
                markSent: (c) => markWarningSent('forms', 'id', c.form_id, 'form_deletion_warning_sent_at'),
                logContext: (c) => ({ formId: c.form_id })
            })
            
            const deleted = await deleteExpiredRecords('forms', 'created_at', '6 months')
            
            return { warned, deleted }
        }
    })
}
