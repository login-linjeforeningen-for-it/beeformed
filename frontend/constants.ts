import packageInfo from './package.json'

const { env } = process

const config = {
    url: {
        api: env.API_URL,
        cdn: 'https://s3.login.no/beehive',
        gitlab: 'https://gitlab.login.no',
        github: 'https://github.com/login-linjeforeningen-for-it',
        login: 'https://login.no',
        mail: 'kontakt@login.no',
    },
    authPath: {
        login: '/api/auth/login',
        callback: '/api/auth/callback',
        token: '/api/auth/token',
        logout: '/api/auth/logout',
    },
    authentik: {
        clientId: env.AUTH_CLIENT_ID,
        url: {
            auth: `${env.AUTH_URL}/application/o/authorize/`,
            token: `${env.AUTH_URL}/application/o/token/`,
            userinfo: `${env.AUTH_URL}/application/o/userinfo/`
        }
    },
    version: packageInfo.version,
}

export default config
