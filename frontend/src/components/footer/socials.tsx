import config from '@config'

export default function SocialLinks() {
    const iconStyle = 'leading-8 text-[1.5rem] transition-all duration-200 text-center block text-[var(--color-text-footer)]'

    return (
        <div className='mx-auto mt-20 mb-12 grid w-fit grid-cols-3 justify-between gap-6 sm:grid-cols-6'>
            <a
                className='mx-auto block size-8'
                title='Discord'
                href={config.url.discord}
                target='_blank'
                rel='noreferrer'
            >
                <i className={`${iconStyle} logfont-discord hover:text-[#6571fd]`} />
            </a>
            <a
                className='mx-auto block size-8'
                title='Instagram'
                href={config.url.instagram}
                target='_blank'
                rel='noreferrer'
            >
                <i className={`${iconStyle} logfont-instagram
                    bg-[linear-gradient(45deg,#fff695_0%,#fff695_5%,#ff5445_45%,#ff37c0_60%,#3d6dff_90%)]
                    bg-clip-text hover:text-transparent`} />
            </a>
            <a
                className='mx-auto block size-8'
                title='Facebook'
                href={config.url.facebook}
                target='_blank'
                rel='noreferrer'
            >
                <i className={`${iconStyle} logfont-facebook hover:text-[#2c87ff]`} />
            </a>
            <a
                className='mx-auto block size-8'
                title='Linkedin'
                href={config.url.linkedin}
                target='_blank'
                rel='noreferrer'
            >
                <i className={`${iconStyle} logfont-linkedin hover:text-[#1a7bdd]`} />
            </a>
            <a
                className='mx-auto block size-8'
                title='Gitlab'
                href={config.url.gitlab}
                target='_blank'
                rel='noreferrer'
            >
                <i className={`${iconStyle} logfont-gitlab hover:text-[#f6492e]`} />
            </a>
            <a
                className='mx-auto block size-8'
                title='Wiki'
                href={config.url.wiki}
                target='_blank'
                rel='noreferrer'
            >
                <i className={`${iconStyle} logfont-wikijs hover:text-[rgb(5,186,243)]`} />
            </a>
        </div>
    )
}
