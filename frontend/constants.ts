import packageInfo from './package.json'

const { env } = process

const config = {
    url: {
        api: env.API_URL || 'http://forms-api.login.no/api',
        cdn: 'https://cdn.login.no',
        gitlab: 'https://gitlab.login.no',
        login: 'https://login.no',
        mail: 'kontakt@login.no',
        linkedin: 'https://www.linkedin.com/company/linjeforeningen-login/about',
        wiki: 'https://wiki.login.no',
        facebook: 'https://facebook.com/LogNTNU',
        instagram: 'https://www.instagram.com/login_linjeforening/',
        discord: 'https://discord.gg/login-ntnu'

    },
    authPath: {
        login: '/api/auth/login',
        callback: '/api/auth/callback',
        token: '/api/auth/token',
        logout: '/api/auth/logout',
    },
    authentik: {
        clientId: env.AUTH_CLIENT_ID,
        clientSecret: env.AUTH_CLIENT_SECRET,
        url: {
            auth: `${env.AUTH_URL}/application/o/authorize/`,
            token: `${env.AUTH_URL}/application/o/token/`,
            userinfo: `${env.AUTH_URL}/application/o/userinfo/`
        }
    },
    version: packageInfo.version,
}

export default config
