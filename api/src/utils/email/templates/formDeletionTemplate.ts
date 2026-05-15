import { appendEmailFooter, buildWarningCard, renderEmailLayout } from './templateLayout.ts'

export function createFormDeletionWarningTemplate(content: FormDeletionWarningEmailContent): EmailTemplate {
    const name = content.name?.trim() || 'there'
    const subject = 'Form deletion warning'
    const message = `Your form "${content.formTitle}" is scheduled for automatic deletion in ${content.warningDays} days.`

    return {
        subject,
        html: renderEmailLayout({
            title: subject,
            preheader: message,
            header: 'Form Deletion Warning',
            body: buildWarningCard(content.name,
                Bun.escapeHTML(message),
                'Forms are deleted automatically 6 months after creation and cannot be extended.',
                'If you no longer need the form, no action is required.'
            ),
            actionUrl: content.actionUrl,
            actionText: 'Open Form'
        }),
        text: appendEmailFooter([
            `Hi ${name},`, '',
            message,
            'Forms are deleted automatically 6 months after creation and cannot be extended.', '',
            `Open your form here: ${content.actionUrl}`, '',
            'If you no longer need the form, no action is required.'
        ])
    }
}
