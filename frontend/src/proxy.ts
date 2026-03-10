import appConfig from '@config'
import { NextRequest, NextResponse } from 'next/server'

export async function proxy(req: NextRequest) {
    const tokenCookie = req.cookies.get('access_token')
    let validToken = false

    if (!pathIsAllowedWhileUnauthorized(req.nextUrl.pathname)) {
        if (!tokenCookie) {
            const res = NextResponse.redirect(new URL('/', req.url))
            if (!req.cookies.get('redirect_after_login')) {
                res.cookies.set('redirect_after_login', req.nextUrl.pathname)
            }
            return res
        }

        const token = tokenCookie.value

        if (!validToken) {
            validToken = await tokenIsValid(token)
            if (!validToken) {
                return NextResponse.redirect(new URL('/api/logout', req.url))
            }
        }
    }

    const theme = req.cookies.get('theme')?.value || 'dark'
    const res = NextResponse.next()
    res.headers.set('x-theme', theme)
    return res
}

function pathIsAllowedWhileUnauthorized(path: string) {
    if (path === '/' || path === '/favicon.ico') {
        return true
    }

    if (
        path.startsWith('/_next/static/') ||
        path.startsWith('/_next/image') ||
        path.startsWith('/images/') ||
        path.startsWith('/api/auth') ||
        path.startsWith('/_next/webpack-hmr') ||
        path === '/sw.js'
    ) {
        return true
    }

    return false
}

async function tokenIsValid(token: string): Promise<boolean> {
    try {
        const userInfo = await fetch(appConfig.authentik.url.userinfo, {
            headers: { Authorization: `Bearer ${token}` },
        })

        if (!userInfo.ok) {
            return false
        }

        return true
    } catch (error) {
        console.log(`API Error (middleware.ts): ${error}`, {
            message: (error as Error).message,
            stack: (error as Error).stack,
        })

        return false
    }
}
