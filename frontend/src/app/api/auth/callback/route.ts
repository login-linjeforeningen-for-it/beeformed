import config from '@config'
import { NextRequest } from 'next/server'
import { authCallback } from 'uibee/utils'

export async function GET(request: NextRequest) {
    return await authCallback({
        req: request,
        tokenURL: config.authentik.url.token,
        clientID: config.authentik.clientId,
        clientSecret: process.env.AUTH_CLIENT_SECRET!,
        redirectPath: config.authPath.callback,
        userInfoURL: config.authentik.url.userinfo,
        tokenRedirectPath: config.authPath.token
    })
}
