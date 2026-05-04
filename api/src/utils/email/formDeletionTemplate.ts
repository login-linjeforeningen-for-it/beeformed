import { appendEmailFooter, renderEmailLayout } from './templateLayout.ts'

export function createFormDeletionWarningTemplate(content: FormDeletionWarningEmailContent): EmailTemplate {
    const recipientName = content.name?.trim() || 'there'
    const subject = 'Form deletion warning'
    const header = 'Form Deletion Warning'
    const message = `Your form "${content.formTitle}" is scheduled for automatic deletion in ${content.warningDays} days.`

    const body = `
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #1c1c1c; border: 1px solid #333333; border-radius: 12px; margin-bottom: 16px; border-collapse: separate !important;">
            <tr>
                <td style="padding: 20px;">
                    <p style="margin: 0 0 12px 0; font-size: 15px; line-height: 24px; color: #e5e2e1;">Hi ${Bun.escapeHTML(recipientName)},</p>
                    <p style="margin: 0 0 12px 0; font-size: 15px; line-height: 24px; color: #e5e2e1;">${Bun.escapeHTML(message)}</p>
                    <p style="margin: 0 0 12px 0; font-size: 15px; line-height: 24px; color: #e5e2e1;">Forms are deleted automatically 6 months after creation and cannot be extended.</p>
                    <p style="margin: 0; font-size: 15px; line-height: 24px; color: #e5e2e1;">If you no longer need the form, no action is required.</p>
                </td>
            </tr>
        </table>
    `

    const text = appendEmailFooter([
        `Hi ${recipientName},`,
        '',
        message,
        'Forms are deleted automatically 6 months after creation and cannot be extended.',
        '',
        `Open your form here: ${content.actionUrl}`,
        '',
        'If you no longer need the form, no action is required.'
    ])

    return {
        subject,
        html: renderEmailLayout({
            title: subject,
            preheader: message,
            header,
            body,
            actionUrl: content.actionUrl,
            actionText: 'Open Form'
        }),
        text
    }
}
