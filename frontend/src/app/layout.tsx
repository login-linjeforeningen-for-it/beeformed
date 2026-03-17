import type { Metadata } from 'next'
import 'uibee/styles'
import './globals.css'
import { cookies } from 'next/headers'
import Navbar from '@components/navbar/navbar'
import { Toaster } from 'uibee/components'
import localFont from 'next/font/local'
import Footer from '@components/footer/footer'
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
        <html lang='en' className={`${theme} ${poppins.className} min-h-screen`}>
            <body className='bg-login-800 h-full flex flex-col'>
                <header className='fixed top-0 w-full h-fit z-50'>
                    <Navbar />
                </header>
                <main className='min-h-screen flex pt-20 md:pt-22 w-full overflow-x-hidden'>
                    {children}
                </main>
                <Footer />
                <Toaster />
            </body>
        </html>
    )
}
