import config from '#constants'
import nodemailer from 'nodemailer'
import { createEmailTemplate, type EmailContent } from '#utils/emailTemplate.ts'
import run from '#db'

type MailOptions = {
    to: string
    subject: string
    text: string
    html?: string
}

const retryDelays = [60 * 1000, 5 * 60 * 1000, 15 * 60 * 1000, 30 * 60 * 1000] // 1m, 5m, 15m, 30m

const transporter = config.DISABLE_SMTP ? null : nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: Number(config.SMTP_PORT),
    secure: config.SMTP_SECURE,
    pool: true,
})

export default async function send({ to, subject, text, html }: MailOptions): Promise<string> {
    if (config.DISABLE_SMTP) {
        return 'SMTP disabled'
    }
    const mailOptions = { to, subject, text, html }

    try {
        const info = await attemptSend(mailOptions)
        return info?.response || 'Sent'
    } catch {
        await enqueueEmail(mailOptions)
        return 'Email failed initially, queued for retry'
    }
}

async function attemptSend(mailOptions: MailOptions) {
    return await transporter?.sendMail({
        from: {
            name: 'Login Forms',
            address: config.SMTP_FROM
        },
        ...mailOptions,
    })
}

async function enqueueEmail(mailOptions: MailOptions): Promise<void> {
    try {
        const result = await run(
            `INSERT INTO email_queue ("to", subject, text, html) VALUES ($1, $2, $3, $4) RETURNING id`,
            [mailOptions.to, mailOptions.subject, mailOptions.text, mailOptions.html ?? null]
        )
        const id: number = result.rows[0]?.id
        if (id) {
            setTimeout(() => retryFromQueue(id, mailOptions, 0), retryDelays[0])
        }
    } catch (err) {
        console.error('Failed to queue email in database:', err)
    }
}

async function retryFromQueue(id: number, mailOptions: MailOptions, retryIndex: number): Promise<void> {
    try {
        await run(
            `UPDATE email_queue SET retry_count = $1, last_attempted_at = NOW() WHERE id = $2`,
            [retryIndex + 1, id]
        )
        await attemptSend(mailOptions)
        await run(`DELETE FROM email_queue WHERE id = $1`, [id])
        console.log(`Queued email (id=${id}) sent successfully on retry ${retryIndex + 1}`)
    } catch (error) {
        console.error(`Retry ${retryIndex + 1} failed for queued email (id=${id}):`, error)
        const nextIndex = retryIndex + 1
        if (nextIndex < retryDelays.length) {
            setTimeout(() => retryFromQueue(id, mailOptions, nextIndex), retryDelays[nextIndex])
        } else {
            console.error(`Queued email (id=${id}) exhausted all retries, deleting from database`)
            await run(`DELETE FROM email_queue WHERE id = $1`, [id])
        }
    }
}

export async function processEmailQueue(): Promise<void> {
    if (config.DISABLE_SMTP) return
    try {
        await run(`DELETE FROM email_queue WHERE retry_count >= $1`, [retryDelays.length])

        const result = await run(
            `SELECT id, "to", subject, text, html, retry_count FROM email_queue WHERE retry_count < $1`,
            [retryDelays.length]
        )
        if (result.rows.length === 0) return
        console.log(`Resuming ${result.rows.length} queued email(s) from previous session`)
        for (const row of result.rows) {
            const mailOptions: MailOptions = {
                to: row.to,
                subject: row.subject,
                text: row.text,
                html: row.html ?? undefined
            }
            retryFromQueue(row.id, mailOptions, row.retry_count)
        }
    } catch (err) {
        console.error('Failed to process email queue from database:', err)
    }
}

export async function sendTemplatedMail(to: string, content: EmailContent): Promise<string> {
    const template = await createEmailTemplate(content)
    return send({
        to,
        subject: template.subject,
        text: template.text,
        html: template.html
    })
}