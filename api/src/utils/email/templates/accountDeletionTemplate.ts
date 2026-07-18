import type { AccountDeletionWarningEmailContent, EmailTemplate } from '../sendSMTP.ts'
import { appendEmailFooter, buildWarningCard, renderEmailLayout } from './templateLayout.ts'

export function createAccountDeletionWarningTemplate(content: AccountDeletionWarningEmailContent): EmailTemplate {
    const name = content.name?.trim() || 'there'
    const subject = 'Account deletion warning'
    const message = 'Your forms account has been inactive for almost 6 months and is scheduled '
        + `for automatic deletion in ${content.warningDays} days.`

    return {
        subject,
        html: renderEmailLayout({
            title: subject,
            preheader: message,
            header: 'Account Deletion Warning',
            body: buildWarningCard(content.name,
                Bun.escapeHTML(message),
                'To keep your account, sign in before the deletion date.',
                'If you no longer need the account, no action is required.'
            ),
            actionUrl: content.actionUrl,
            actionText: 'Open BeeFormed'
        }),
        text: appendEmailFooter([
            `Hi ${name},`, '',
            message,
            'To keep your account, sign in before the deletion date.', '',
            `Sign in here: ${content.actionUrl}`, '',
            'If you no longer need the account, no action is required.'
        ])
    }
}
