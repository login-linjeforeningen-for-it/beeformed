import { Footer, loginAddress, loginEmail, loginCopyright, loginSponsor, loginSocialLinks } from 'uibee/components'
import Image from 'next/image'
import config from '@config'

export default function SiteFooter() {
    return (
        <Footer
            logo={
                <Image
                    src={`${config.url.cdn}/img/logo/logo-tekst-white.svg`}
                    alt='Login - Linjeforeningen for IT'
                    width={800}
                    height={200}
                    className='block w-full'
                />
            }
            sponsor={{
                node: (
                    <a href='https://www.mnemonic.io/' target='_blank' rel='noreferrer'>
                        <Image
                            src={`${config.url.cdn}/img/company/mnemonic-logo_light-nopayoff-2021.svg`}
                            alt='mnemonic'
                            width={800}
                            height={200}
                            className='block w-full'
                        />
                    </a>
                ),
                label: loginSponsor.label,
            }}
            columns={[loginAddress, loginEmail(config.url.mail)]}
            socialLinks={loginSocialLinks}
            copyright={loginCopyright}
            version={typeof config.version !== 'undefined' ? {
                tag: config.version,
                href: `${config.url.github}/beeformed`,
            } : undefined}
            lang='en'
        />
    )
}
