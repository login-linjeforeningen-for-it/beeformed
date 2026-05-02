import { appendEmailFooter, renderEmailLayout } from './templateLayout.ts'

export function createAccountDeletionWarningTemplate(content: AccountDeletionWarningEmailContent): EmailTemplate {
    const recipientName = content.name?.trim() || 'there'
    const subject = 'Account deletion warning'
    const header = 'Account Deletion Warning'
    const message = `Your forms account has been inactive for almost 6 months and is scheduled for automatic deletion in ${content.warningDays} days.`

    const body = `
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #1c1c1c; border: 1px solid #333333; border-radius: 12px; margin-bottom: 16px; border-collapse: separate !important;">
            <tr>
                <td style="padding: 20px;">
                    <p style="margin: 0 0 12px 0; font-size: 15px; line-height: 24px; color: #e5e2e1;">Hi ${Bun.escapeHTML(recipientName)},</p>
                    <p style="margin: 0 0 12px 0; font-size: 15px; line-height: 24px; color: #e5e2e1;">${Bun.escapeHTML(message)}</p>
                    <p style="margin: 0 0 12px 0; font-size: 15px; line-height: 24px; color: #e5e2e1;">To keep your account, sign in before the deletion date.</p>
                    <p style="margin: 0; font-size: 15px; line-height: 24px; color: #e5e2e1;">If you no longer need the account, no action is required.</p>
                </td>
            </tr>
        </table>
    `

    const text = appendEmailFooter([
        `Hi ${recipientName},`,
        '',
        message,
        'To keep your account, sign in before the deletion date.',
        '',
        `Sign in here: ${content.actionUrl}`,
        '',
        'If you no longer need the account, no action is required.'
    ])

    return {
        subject,
        html: renderEmailLayout({
            title: subject,
            preheader: message,
            header,
            body,
            actionUrl: content.actionUrl,
            actionText: 'Open BeeFormed'
        }),
        text
    }
}
