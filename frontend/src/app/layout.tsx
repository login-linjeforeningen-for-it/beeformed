import type { Metadata } from 'next'
import 'uibee/styles'
import './globals.css'
import { ViewTransition } from 'react'
import { cookies } from 'next/headers'
import Navbar from '@components/navbar/navbar'
import { Toaster } from 'uibee/components'
import localFont from 'next/font/local'
import Footer from '@components/footer/footer'
import BottomNav from '@components/navbar/bottomnav'
import '@public/fonts/style.css'

export const metadata: Metadata = {
    title: 'Login Forms',
    description: 'Form management system',
}

const poppins = localFont({
    src: './poppins.ttf',
})

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const Cookies = await cookies()
    const theme = Cookies.get('theme')?.value || 'dark'

    return (
        <html lang='en' className={`${theme} ${poppins.className} min-h-dvh`}>
            <body className='flex h-full flex-col bg-login-800'>
                <header className='fixed top-0 z-50 h-fit w-full'>
                    <Navbar />
                </header>
                <main className='flex min-h-dvh w-full overflow-x-hidden pt-20 md:pt-22'>
                    <ViewTransition>
                        {children}
                    </ViewTransition>
                </main>
                <Footer />
                <BottomNav />
                <Toaster />
            </body>
        </html>
    )
}
