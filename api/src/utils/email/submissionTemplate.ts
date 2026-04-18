import { generateQRCodeImage } from '#utils/qr/generator.ts'
import config from '#constants'
import { appendEmailFooter, renderEmailLayout } from './templateLayout.ts'

const { COMPANY_INFO } = config

function generateTextFromStatus(status: EmailContent['status']): { header: string; body: string } {
    const statusText: Record<EmailContent['status'], { header: string; body: string }> = {
        registered: {
            header: 'Submission Confirmed',
            body: 'Your submission has been confirmed.'
        },
        waitlisted: {
            header: 'Added to Waitlist',
            body: 'You have been added to the waitlist.'
        },
        rejected: {
            header: 'Submission Rejected',
            body: 'Your submission has been rejected.'
        },
        cancelled: {
            header: 'Submission Cancelled',
            body: 'Your submission has been cancelled.'
        },
        bumped: {
            header: 'Moved out of Waitlist',
            body: 'A spot opened up and you have been moved from the waitlist to registered list.'
        }
    }

    return statusText[status]
}

function generateSubmissionEmailHTML(content: EmailContent, qrCodeImageDataUrl?: string | null): string {
    const { title, status, ownerEmail, actionUrl, actionText, submissionId } = content

    const { header, body } = generateTextFromStatus(status)

    const bodyContent = `
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #202020; border: 1px solid #333333; border-radius: 12px; margin-bottom: 32px; border-collapse: separate !important;">
            <tr>
                <td align="center" style="padding: 24px;">
                    <table role="presentation" width="148" border="0" cellspacing="0" cellpadding="0" style="width: 148px; height: 148px; border: 2px dashed rgba(253, 135, 56, 0.3); border-radius: 8px; background-color: #ffffff; border-collapse: separate !important;">
                        <tr>
                            <td align="center" valign="middle" style="width: 148px; height: 148px;">
                                ${qrCodeImageDataUrl
        ? `<img src="${qrCodeImageDataUrl}" alt="QR code (unblock to view / see attachments)" width="148" height="148" style="width: 148px; height: 148px; display: block; border-radius: 6px;" />`
        : '<span style="display: inline-block; font-family: system-ui, -apple-system, \'Segoe UI\', Roboto, Arial, sans-serif; font-size: 11px; line-height: 14px; color: rgba(253, 135, 56, 0.7); letter-spacing: 1px; text-transform: uppercase; padding: 8px;">QR Unavailable</span>'}
                            </td>
                        </tr>
                    </table>
                    <p style="margin: 12px 0 0 0; font-size: 10px; line-height: 14px; letter-spacing: 2px; text-transform: uppercase; color: #a1a1a1;">Ticket QR</p>
                </td>
            </tr>
        </table>

        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 16px;">
            <tr>
                <td align="left" valign="middle" style="font-size: 10px; line-height: 12px; letter-spacing: 3px; text-transform: uppercase; color: ${COMPANY_INFO.primaryColor}; font-weight: 700; white-space: nowrap; padding-right: 8px;">Entry Details</td>
                <td align="left" valign="middle" style="width: 100%; padding-left: 8px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                            <td style="vertical-align: middle; height: 16px;">
                                <div style="height:1px; background: #333333; width:100%; line-height:1px; font-size:1px;">&nbsp;</div>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #1c1c1c; border: 1px solid #333333; border-radius: 12px; margin-bottom: 16px; border-collapse: separate !important;">
            <tr class="stack">
                <td valign="top" style="padding: 20px; width: 70%;">
                    <p style="margin: 0 0 6px 0; font-size: 9px; line-height: 12px; letter-spacing: 2px; text-transform: uppercase; color: #a1a1a1;">Form Title</p>
                    <p style="margin: 0; font-size: 16px; line-height: 22px; color: #e5e2e1; font-weight: 500;">${title}</p>
                </td>
                <td valign="top" style="padding: 20px; width: 30%;">
                    <p style="margin: 0 0 6px 0; font-size: 9px; line-height: 12px; letter-spacing: 2px; text-transform: uppercase; color: #a1a1a1;">Status</p>
                    <span style="display: inline-block; padding: 4px 10px; border-radius: 999px; border: 1px solid rgba(253, 135, 56, 0.2); background-color: rgba(253, 135, 56, 0.1); color: ${COMPANY_INFO.primaryColor}; font-size: 9px; line-height: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">${status}</span>
                </td>
            </tr>
        </table>

        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #1c1c1c; border: 1px solid #333333; border-radius: 12px; margin-bottom: 16px; border-collapse: separate !important;">
            <tr>
                <td style="padding: 20px;">
                    <p style="margin: 0 0 6px 0; font-size: 9px; line-height: 12px; letter-spacing: 2px; text-transform: uppercase; color: #a1a1a1;">Reference ID</p>
                    <p style="margin: 0; font-size: 16px; line-height: 22px; color: #e5e2e1; font-weight: 500;">${submissionId}</p>
                </td>
            </tr>
        </table>

        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #1c1c1c; border: 1px solid #333333; border-radius: 12px; margin-bottom: 16px; border-collapse: separate !important;">
            <tr>
                <td style="padding: 20px;">
                    <p style="margin: 0 0 6px 0; font-size: 9px; line-height: 12px; letter-spacing: 2px; text-transform: uppercase; color: #a1a1a1;">Message</p>
                    <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 24px; color: #e5e2e1; white-space: pre-line;">${body}</p>
                    <p style="margin: 0 0 6px 0; font-size: 9px; line-height: 12px; letter-spacing: 2px; text-transform: uppercase; color: #a1a1a1;">Form Contact</p>
                    <p style="margin: 0; font-size: 15px; line-height: 24px; color: #e5e2e1;">${ownerEmail}</p>
                </td>
            </tr>
        </table>
    `

    return renderEmailLayout({
        title,
        preheader: `${header} - ${title}`,
        header,
        body: bodyContent,
        actionUrl,
        actionText
    })
}

function generateSubmissionEmailText(content: EmailContent): string {
    const { title, status, ownerEmail, actionUrl, actionText } = content

    const { header, body } = generateTextFromStatus(status)

    const lines = [
        header,
        '',
        title,
        '',
        status,
        '',
        body,
        '',
        `If you have any questions, please contact the form owner at ${ownerEmail}.`
    ]

    if (actionUrl && actionText) {
        lines.push('', `${actionText}: ${actionUrl}`)
    }

    return appendEmailFooter(lines)
}

export async function createSubmissionEmailTemplate(content: EmailContent): Promise<EmailTemplate> {
    const qrCode = content.submissionId ? await generateQRCodeImage({ data: content.submissionId }) : null
    const attachments = qrCode && content.submissionId
        ? [{
            filename: `submission-${content.submissionId}-qr.png`,
            content: qrCode.pngBuffer,
            contentType: 'image/png'
        }]
        : undefined

    const { header } = generateTextFromStatus(content.status)

    return {
        subject: `${header} - ${content.title}`,
        html: generateSubmissionEmailHTML(content, qrCode?.pngDataUrl),
        text: generateSubmissionEmailText(content),
        attachments
    }
}
