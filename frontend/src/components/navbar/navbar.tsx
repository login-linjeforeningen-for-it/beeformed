'use client'

import { useState, useEffect } from 'react'
import { getCookie } from 'utilbee/utils'
import { Navbar as NavBar, NavItem } from 'uibee/components'
import config from '@config'

export default function Navbar() {
    const [token, setToken] = useState<string | null>(null)

    useEffect(() => {
        setToken(getCookie('access_token'))
    }, [])

    return (
        <NavBar
            token={token}
            disableLanguageToggle
            disableThemeToggle
            lang={undefined}
            loginPath={config.authPath.login}
            logoutPath={config.authPath.logout}
            theme={'dark'}
        >
            <NavItem
                href='/profile'
            >
                Profile
            </NavItem>
            <NavItem
                href='/forms'
            >
                Forms
            </NavItem>
            <NavItem
                href='/submissions'
            >
                Submissions
            </NavItem>
            <NavItem
                href={config.url.login}
                external
            >
                Login
            </NavItem>
        </NavBar>
    )
}
