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

const config = {
    PORT: Number(process.env.PORT) || 8080,
    USERINFO_URL: `${process.env.AUTH_URL}/application/o/userinfo/`,
    DB: process.env.DB,
    DB_USER: process.env.DB_USER,
    DB_HOST: process.env.DB_HOST,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_PORT: Number(process.env.DB_PORT) || 5432,
    DB_MAX_CONN: 20,
    DB_IDLE_TIMEOUT_MS: 5000,
    DB_TIMEOUT_MS: 3000,
    CACHE_TTL: 30_000,
    NEGATIVE_CACHE_TTL: 10_000,
    TRUST_PROXY: process.env.TRUST_PROXY === 'true',
    RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX) || 200,
    RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW || '1 minute',
    DISABLE_SMTP: disableSMTP,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_NAME: process.env.SMTP_NAME,
    SMTP_PORT: Number(process.env.SMTP_PORT) || 465,
    SMTP_SECURE: process.env.SMTP_SECURE === 'true',
    SMTP_FROM: process.env.SMTP_FROM || '',
    SMTP_USER: process.env.SMTP_USER || '',
    SMTP_PASSWORD: process.env.SMTP_PASSWORD || '',
    FRONTEND_URL: process.env.FRONTEND_URL,
    COMPANY_INFO: {
        name: 'Login - Linjeforeningen for IT',
        nameShort: 'Login',
        logo: 'https://s3.login.no/beehive/img/logo/logo.svg',
        website: 'https://login.no',
        email: 'kontakt@login.no',
        primaryColor: '#fd8738'
    }
}

export default config
