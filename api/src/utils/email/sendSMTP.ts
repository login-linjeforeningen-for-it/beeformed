import type { FastifyInstance } from 'fastify'
import config from '#constants'
import nodemailer from 'nodemailer'
import { createSubmissionEmailTemplate } from './templates/submissionTemplate.ts'
import { createAccountDeletionWarningTemplate } from './templates/accountDeletionTemplate.ts'
import { createFormDeletionWarningTemplate } from './templates/formDeletionTemplate.ts'
import run from '#db'
import { logError, logInfo } from '#utils/logger.ts'

export type QueuedEmailType = 'submission' | 'account_deletion_warning' | 'form_deletion_warning'

export type EmailTemplate = {
    subject: string
    html: string
    text: string
    attachments?: Array<{
        filename: string
        content: Buffer
        contentType: string
    }>
}

export type EmailContent = {
    title: string
    status: 'registered' | 'waitlisted' | 'rejected' | 'cancelled' | 'bumped'
    ownerEmail: string
    actionUrl?: string
    actionText?: string
    submissionId: string
}

export type AccountDeletionWarningEmailContent = {
    name?: string | null
    warningDays: number
    actionUrl: string
}

export type FormDeletionWarningEmailContent = {
    name?: string | null
    formTitle: string
    warningDays: number
    actionUrl: string
}

export type EmailPayloadMap = {
    submission: EmailContent
    account_deletion_warning: AccountDeletionWarningEmailContent
    form_deletion_warning: FormDeletionWarningEmailContent
}

const MAX_RETRIES = 4
const CLAIM_LOCK_MINUTES = 5

const transporter = config.DISABLE_SMTP ? null : nodemailer.createTransport({
    name: config.SMTP_NAME,
    host: config.SMTP_HOST,
    port: Number(config.SMTP_PORT),
    secure: config.SMTP_SECURE,
    pool: true,
    ...(config.SMTP_USER && config.SMTP_PASSWORD ? { auth: { user: config.SMTP_USER, pass: config.SMTP_PASSWORD } } : {})
})

const templateBuilders: { [T in QueuedEmailType]: (p: EmailPayloadMap[T]) => EmailTemplate | Promise<EmailTemplate> } = {
    submission: createSubmissionEmailTemplate,
    account_deletion_warning: createAccountDeletionWarningTemplate,
    form_deletion_warning: createFormDeletionWarningTemplate,
}

async function dispatchEmail(type: QueuedEmailType, to: string, payload: unknown): Promise<void> {
    const builder = templateBuilders[type] as (p: unknown) => EmailTemplate | Promise<EmailTemplate>
    const template = await builder(payload)
    await transporter?.sendMail({ from: { name: 'Login Forms', address: config.SMTP_FROM }, to, ...template })
}

async function queueEmail(type: QueuedEmailType, to: string, payload: object): Promise<void> {
    try {
        await run(
            'INSERT INTO email_queue ("to", email_type, payload) VALUES ($1, $2, $3)',
            [to, type, JSON.stringify(payload)]
        )
    } catch (err) {
        logError('Failed to queue email in database', { event: 'email.queue.enqueue_failed', error: err })
    }
}

async function processQueue(): Promise<void> {
    await run('DELETE FROM email_queue WHERE retry_count >= $1', [MAX_RETRIES])

    const claimed = await run(
        `UPDATE email_queue
         SET last_attempted_at = NOW()
         WHERE id IN (
             SELECT id FROM email_queue
             WHERE retry_count < $1
               AND (last_attempted_at IS NULL OR last_attempted_at < NOW() - ($2::int * INTERVAL '1 minute'))
             FOR UPDATE SKIP LOCKED
         )
         RETURNING id, "to", email_type, payload`,
        [MAX_RETRIES, CLAIM_LOCK_MINUTES]
    )

    if (claimed.rows.length === 0) return
    logInfo('Processing queued emails', { event: 'email.queue.process', count: claimed.rows.length })

    for (const row of claimed.rows) {
        try {
            await dispatchEmail(row.email_type as QueuedEmailType, row.to, row.payload)
            await run('DELETE FROM email_queue WHERE id = $1', [row.id])
            logInfo('Queued email sent successfully', { event: 'email.queue.retry_success', queueId: row.id })
        } catch (error) {
            await run('UPDATE email_queue SET retry_count = retry_count + 1 WHERE id = $1', [row.id])
            logError('Queued email send failed', { event: 'email.queue.retry_failed', queueId: row.id, error })
        }
    }
}

export async function emailQueueScheduler(_fastify: FastifyInstance) {
    try {
        await processQueue()
    } catch (err) {
        logError('Failed to process email queue', { event: 'email.queue.process_failed', error: err })
    }
    Bun.cron('*/15 * * * *', async () => {
        try {
            await processQueue()
        } catch (err) {
            logError('Failed to process email queue', { event: 'email.queue.process_failed', error: err })
        }
    })
}

export async function sendTypedEmail<T extends QueuedEmailType>(type: T, to: string, payload: EmailPayloadMap[T]): Promise<string> {
    if (config.DISABLE_SMTP) return 'SMTP disabled'
    try {
        await dispatchEmail(type, to, payload)
        return 'Sent'
    } catch {
        await queueEmail(type, to, payload)
        return 'Email failed initially, queued for retry'
    }
}
