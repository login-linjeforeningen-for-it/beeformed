import config from '#constants'

const { COMPANY_INFO } = config

function renderActionButton(actionUrl: string, actionText: string) {
    return `
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
                <td align="center" style="padding-top: 12px;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${actionUrl}" style="height:48px;v-text-anchor:middle;width:260px;" arcsize="50%" stroke="f" fillcolor="${COMPANY_INFO.primaryColor}">
                        <w:anchorlock/>
                        <center style="color:#ffffff;font-family:Arial, sans-serif;font-size:14px;font-weight:700;">${actionText}</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-- -->
                    <a href="${actionUrl}" style="display: inline-block; background-color: ${COMPANY_INFO.primaryColor}; color: #ffffff; text-decoration: none; border-radius: 999px; font-weight: 700; font-size: 14px; line-height: 48px; padding: 0 28px; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif;">${actionText}</a>
                    <!--<![endif]-->
                </td>
            </tr>
        </table>
    `
}

export function renderEmailLayout(options: {
    title: string
    preheader: string
    header: string
    body: string
    actionUrl?: string
    actionText?: string
}) {
    const { title, preheader, header, body, actionUrl, actionText } = options

    return `
        <!DOCTYPE html>
        <html lang="en" xmlns="http://www.w3.org/1999/xhtml">
        <head>
            <meta charset="utf-8"/>
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            <meta http-equiv="x-ua-compatible" content="ie=edge"/>
            <meta name="x-apple-disable-message-reformatting"/>
            <title>${title}</title>
            <style>
                body,
                table,
                td,
                a {
                    -ms-text-size-adjust: 100%;
                    -webkit-text-size-adjust: 100%;
                }

                table,
                td {
                    mso-table-lspace: 0pt;
                    mso-table-rspace: 0pt;
                }

                img {
                    -ms-interpolation-mode: bicubic;
                    border: 0;
                    outline: none;
                    text-decoration: none;
                    display: block;
                }

                table {
                    border-collapse: collapse !important;
                }

                body {
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                    background-color: #0a0a0a;
                }

                a {
                    color: ${COMPANY_INFO.primaryColor};
                }

                @media screen and (max-width: 620px) {
                    .container {
                        width: 100% !important;
                    }

                    .pad-32 {
                        padding: 24px !important;
                    }

                    .h1 {
                        font-size: 24px !important;
                        line-height: 32px !important;
                    }

                    .stack,
                    .stack td {
                        display: block !important;
                        width: 100% !important;
                    }

                    .stack td {
                        padding-bottom: 16px !important;
                    }
                }
            </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #0a0a0a;">
            <div style="display: none; font-size: 1px; color: #0a0a0a; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden;">
                ${preheader}
            </div>

            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0a0a0a;">
                <tr>
                    <td align="center" style="padding: 32px 12px;">
                        <table role="presentation" width="600" border="0" cellspacing="0" cellpadding="0" class="container" style="width: 600px; max-width: 600px; background-color: #181818; border: 1px solid #333333; border-radius: 16px; overflow: hidden; border-collapse: separate !important;">
                            <tr>
                                <td class="pad-32" style="padding: 32px; border-bottom: 1px solid #333333;">
                                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                                        <tr>
                                            <td align="left" valign="middle" style="width: 100px;">
                                                <img src="https://cdn.login.no/img/logo/logo-white-small.png" alt="Login logo" width="50" style="width: 50px; max-width: 50px; height: auto; display: block;" />
                                            </td>
                                            <td align="right" valign="middle" style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; font-size: 18px; line-height: 24px; letter-spacing: 1px; color: #e5e2e1; font-weight: 700; text-transform: uppercase;">
                                                ${COMPANY_INFO.name}
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <tr>
                                <td class="pad-32" style="padding: 32px; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; color: #e5e2e1;">
                                    <h1 class="h1" style="margin: 0 0 32px 0; font-size: 28px; line-height: 36px; font-weight: 800; color: #e5e2e1;">
                                        ${header}
                                    </h1>

                                    ${body}

                                    ${actionUrl && actionText ? renderActionButton(actionUrl, actionText) : ''}
                                </td>
                            </tr>

                            <tr>
                                <td class="pad-32" style="padding: 32px; border-top: 1px solid #333333; background-color: #202020; text-align: center; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif;">
                                    <p style="margin: 0 0 4px 0; font-size: 10px; line-height: 16px; color: #a1a1a1;"><strong style="color: #e5e2e1;">${COMPANY_INFO.name}</strong></p>
                                    <p style="margin: 0 0 4px 0; font-size: 10px; line-height: 16px; color: #a1a1a1;">Questions? Contact us at <a href="mailto:${COMPANY_INFO.email}" style="color: ${COMPANY_INFO.primaryColor}; text-decoration: none;">${COMPANY_INFO.email}</a></p>
                                    <p style="margin: 0; font-size: 10px; line-height: 16px; color: #7a7a7a;"><em>Sent from BeeFormed on behalf of ${COMPANY_INFO.nameShort}.</em></p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
    </html>`
}

export function appendEmailFooter(lines: string[]) {
    return [
        ...lines,
        '',
        '---',
        '',
        COMPANY_INFO.name,
        COMPANY_INFO.email,
        COMPANY_INFO.website,
        '',
        'Denne e-posten ble sendt fra BeeFormed - vårt skjemasystem.',
        `Hvis du har spørsmål, kontakt oss på ${COMPANY_INFO.email}`
    ].join('\n')
}
