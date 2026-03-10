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
        <div className='w-full min-h-full flex items-center justify-center'>
            <LoginPage
                title='Nettskjema'
                redirectPath={config.authPath.login}
                version={config.version}
            />
        </div>
    )
}
