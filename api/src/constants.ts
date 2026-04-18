import { envLoad } from 'utilbee'

envLoad({path: ['.env', '../.env']})

const requiredEnvironmentVariables = [
    'AUTH_URL',
    'DB',
    'DB_USER',
    'DB_HOST',
    'DB_PASSWORD',
    'DB_PORT',
    'FRONTEND_URL'
]

const smtpVariables = [
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_SECURE',
    'SMTP_FROM',
    'SMTP_NAME'
]

const disableSMTP = process.env.DISABLE_SMTP === 'true'

if (!disableSMTP) {
    requiredEnvironmentVariables.push(...smtpVariables)
}

const missingVariables = requiredEnvironmentVariables.filter(
    (key) => !process.env[key]
)

if (missingVariables.length > 0) {
    throw new Error(
        'Missing essential environment variables:\n' +
            missingVariables
                .map((key) => `${key}: ${process.env[key] || 'undefined'}`)
                .join('\n')
    )
}

const env = Object.fromEntries(
    requiredEnvironmentVariables.map((key) => [key, process.env[key]])
)

if (!disableSMTP) {
    smtpVariables.forEach((key) => {
        env[key] = process.env[key]
    })
}

const config = {
    PORT: Number(process.env.PORT) || 8080,
    USERINFO_URL: `${env.AUTH_URL}/application/o/userinfo/`,
    DB: env.DB,
    DB_USER: env.DB_USER,
    DB_HOST: env.DB_HOST,
    DB_PASSWORD: env.DB_PASSWORD,
    DB_PORT: Number(env.DB_PORT) || 5432,
    DB_MAX_CONN: 20,
    DB_IDLE_TIMEOUT_MS: 5000,
    DB_TIMEOUT_MS: 3000,
    CACHE_TTL: 1000,
    DISABLE_SMTP: disableSMTP,
    SMTP_HOST: env.SMTP_HOST,
    SMTP_NAME: env.SMTP_NAME,
    SMTP_PORT: Number(env.SMTP_PORT) || 465,
    SMTP_SECURE: env.SMTP_SECURE === 'true',
    SMTP_FROM: env.SMTP_FROM || '',
    SMTP_USER: process.env.SMTP_USER || '',
    SMTP_PASSWORD: process.env.SMTP_PASSWORD || '',
    FRONTEND_URL: env.FRONTEND_URL,
    COMPANY_INFO: {
        name: 'Login - Linjeforeningen for IT',
        nameShort: 'Login',
        logo: 'https://cdn.login.no/img/logo/logo.svg',
        website: 'https://login.no',
        email: 'kontakt@login.no',
        primaryColor: '#fd8738'
    }
}

export default config
