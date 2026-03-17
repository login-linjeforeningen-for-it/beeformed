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
        <div className='bg-login-950 mt-24 md:mt-40'>
            <div className='w-full mx-auto pt-16 px-4 pb-4 md:max-w-304
                md:pt-20 md:px-12 md:pb-4 md:grid md:grid-cols-[18rem_1fr] md:gap-x-12'>
                <div className='grid gap-16 max-w-60 w-full mx-auto md:row-span-2 md:max-w-72 md:gap-20'>
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
                        <p className='text-center text-login-100 pt-8'>{text.footer.sponsor}</p>
                    </div>
                </div>
                <div className='grid w-full max-w-60 mt-12 gap-8 sm:grid-cols-2 sm:max-w-88
                    sm:justify-items-end sm:justify-self-end md:col-start-2 md:row-start-1
                    md:max-w-136 md:justify-self-end md:mt-0 md:gap-0'>
                    <div className='sm:justify-self-center md:justify-self-end'>
                        <h4 className='text-login-100 font-medium text-sm tracking-widest pb-2'>
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
                        <h4 className='text-login-100 font-medium text-sm tracking-widest pb-2'>
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
                <div className='flex flex-col gap-4 mt-16 md:mt-24 md:grid md:grid-cols-[auto_min-content] md:gap-8 items-start md:items-end md:col-span-2 md:row-start-3'>
                    <p
                        className='text-login-100 text-xs wrap-break-word'
                    >
                        {`${text.footer.copy1} ${currentYear} ${text.footer.copy2}`}
                    </p>
                    {typeof config.version !== 'undefined' ? (
                        <Link
                            className='bg-[rgba(200,200,200,0.1)] px-[0.6rem] py-[0.4rem] w-fit
                                rounded-(--border-radius) text-white tracking-wide font-semibold'
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
