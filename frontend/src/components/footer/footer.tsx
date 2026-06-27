import config from '@config'
import SocialLinks from './socials'
import Image from 'next/image'
import Link from 'next/link'

const text = {
    'footer': {
        'contactInfo': {
            'address': {
                'header': 'Address',
                'info1': 'Teknologivegen 22',
                'info2': 'Building A, room 155',
                'info3': '2815 GJØVIK'
            },
            'email': 'Email'
        },
        'sponsor': 'Main partner',
        'copy1': 'Copyright ©',
        'copy2': ' Login - Linjeforeningen for IT, NO 811 940 372'
    }
}

export default async function Footer() {
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()

    return (
        <div className='mt-24 bg-login-950 md:mt-40'>
            <div className='mx-auto w-full px-4 pt-16 pb-24 md:grid
                md:max-w-304 md:grid-cols-[18rem_1fr] md:gap-x-12 md:px-12 md:pt-20 md:pb-4'>
                <div className='mx-auto grid w-full max-w-60 gap-16 md:row-span-2 md:max-w-72 md:gap-20'>
                    <div>
                        <div className='block w-full'>
                            <Image
                                src={`${config.url.cdn}/img/logo/logo-tekst-white.svg`}
                                className='block w-full'
                                alt='Login - Linjeforeningen for IT'
                                width={800}
                                height={200}
                            />
                        </div>
                    </div>
                    <div>
                        <Link href='https://www.mnemonic.io/' target='_blank'>
                            <div className='block w-full'>
                                <Image
                                    src={`${config.url.cdn}/img/company/mnemonic-logo_light-nopayoff-2021.svg`}
                                    className='block w-full'
                                    alt='mnemonic'
                                    width={800}
                                    height={200}
                                />
                            </div>
                        </Link>
                        <p className='pt-8 text-center text-login-100'>{text.footer.sponsor}</p>
                    </div>
                </div>
                <div className='mt-12 grid w-full max-w-60 gap-8 sm:max-w-88 sm:grid-cols-2
                    sm:justify-items-end sm:justify-self-end md:col-start-2 md:row-start-1
                    md:mt-0 md:max-w-136 md:gap-0 md:justify-self-end'>
                    <div className='sm:justify-self-center md:justify-self-end'>
                        <h4 className='pb-2 text-sm font-medium tracking-widest text-login-100'>
                            {text.footer.contactInfo.address.header}
                        </h4>
                        <p>
                            {text.footer.contactInfo.address.info1}
                            <br />
                            {text.footer.contactInfo.address.info2}
                            <br />
                            {text.footer.contactInfo.address.info3}
                        </p>
                    </div>
                    <div className='sm:justify-self-center md:justify-self-end'>
                        <h4 className='pb-2 text-sm font-medium tracking-widest text-login-100'>
                            {text.footer.contactInfo.email}
                        </h4>
                        <p>
                            <a
                                className=' link--underscore-hover'
                                href={`mailto:${config.url.mail}`}
                            >
                                {config.url.mail}
                            </a>
                        </p>
                    </div>
                </div>
                <div className='md:col-start-2 md:row-start-2 md:justify-self-end'>
                    <SocialLinks />
                </div>
                <div className='mt-16 flex flex-col items-start gap-4 md:col-span-2
                    md:row-start-3 md:mt-24 md:grid
                    md:grid-cols-[auto_min-content] md:items-end md:gap-8'>
                    <p
                        className='text-xs wrap-break-word text-login-100'
                    >
                        {`${text.footer.copy1} ${currentYear} ${text.footer.copy2}`}
                    </p>
                    {typeof config.version !== 'undefined' ? (
                        <Link
                            className='w-fit rounded-(--border-radius) bg-[rgba(200,200,200,0.1)] px-[0.6rem]
                                py-[0.4rem] font-semibold tracking-wide text-white'
                            target='_blank'
                            href={`${config.url.gitlab}/tekkom/web/beehive/frontend/-/tags/${config.version}`}
                        >
                            v{config.version}
                        </Link>
                    ) : null}
                </div>
            </div>
        </div>
    )
}
