import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import config from '@config'
import { LoginPage } from 'uibee/components'

export default async function Home() {
    const Cookies = await cookies()
    const token = Cookies.get('access_token')?.value

    if (token) {
        redirect('/profile')
    }

    return (
        <div className='flex min-h-full w-full items-start justify-center px-4 py-6 sm:items-center sm:py-10'>
            <LoginPage
                title='BeeFormed'
                redirectPath={config.authPath.login}
                version={config.version}
            />
        </div>
    )
}
