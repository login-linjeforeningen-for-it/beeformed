'use client'

import config from '@config'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from 'uibee/components'

export default function NotFoundPage() {
    const router = useRouter()

    return (
        <div className='m-auto max-w-160 px-4 py-16 800px:flex 800px:max-w-300 800px:items-center 800px:justify-around 800px:gap-8'>
            <div className='m-auto block w-full max-w-160'>
                <Image
                    src={`${config.url.cdn}/img/pizza404.png`}
                    className='not-block m-auto w-full max-w-160' alt='Hangry 404'
                    width={1508}
                    height={1200}
                />
            </div>
            <div className='mt-4 flex w-full flex-col gap-4 800px:m-auto 800px:w-fit 800px:pr-4 800px:text-left'>
                <h1 className='text-[2rem]'>It's empty here...</h1>
                <p>
                    This site does not exist. This will not be fixed until TekKom gets more pizza...
                </p>
                <Button
                    text='Go back'
                    onClick={async () => { router.back(); return {} }}
                    icon={<ArrowLeft className='' />}
                />
            </div>
        </div>
    )
}
