import { PageContainer } from 'uibee/components'
import { getUser, getForms, getUserSubmissions } from '@utils/api/server'
import { FilePlus, Files, FileText, User as UserIcon, Calendar, Mail } from 'lucide-react'
import Link from 'next/link'
import { formatDateTime } from '@utils/dateTime'
import Confirm from '@components/button/confirm'
import React from 'react'

export default async function Page() {
    const userPromise = getUser()
    const formsPromise = getForms({ limit: 1 })
    const submissionsPromise = getUserSubmissions({ limit: 1 })

    let user
    let forms
    let submissions

    try {
        [user, forms, submissions] = await Promise.all([
            userPromise,
            formsPromise,
            submissionsPromise
        ]) as [any, any, any] // eslint-disable-line @typescript-eslint/no-explicit-any
    } catch {
        return (
            <PageContainer title='Profile'>
                <div className='mx-auto w-full max-w-3xl'>
                    <div className='flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-red-500'>
                        <div className='rounded-full bg-red-500/20 p-2'>
                            <UserIcon className='size-5' />
                        </div>
                        <div>
                            <h3 className='font-semibold'>User not found</h3>
                            <p className='text-sm opacity-80'>Please try logging in again.</p>
                        </div>
                    </div>
                </div>
            </PageContainer>
        )
    }

    const formCount = (forms && forms.total) ? forms.total : 0
    const submissionCount = (submissions && submissions.total) ? submissions.total : 0
    const userInitials = user.name
        ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
        : (user.email ? user.email.substring(0, 2).toUpperCase() : '??')

    return (
        <PageContainer title='Profile'>
            <div className='animate-in fade-in slide-in-from-bottom-4 mx-auto w-full max-w-5xl space-y-8 duration-700'>

                <div className={`relative flex flex-col
                    items-center gap-8 overflow-hidden rounded-3xl border border-login-500 bg-login-600 p-6
                    md:flex-row md:items-start md:p-10`}>

                    <div className={`pointer-events-none absolute top-0 right-0 size-64 translate-x-1/2 -translate-y-1/2 
                        rounded-full bg-login-500/5 blur-3xl`} />

                    <div className='group relative'>
                        <div className={`flex size-24 items-center justify-center rounded-full bg-linear-to-br 
                            from-login-500 to-login-600 text-3xl font-bold text-white 
                            shadow-xl ring-4 ring-login-800 transition-transform duration-300 group-hover:scale-105 
                            md:size-32 md:text-5xl`}>
                            {userInitials}
                        </div>
                    </div>

                    <div className='z-10 flex flex-1 flex-col items-center text-center md:items-start md:text-left'>
                        <h2 className='text-3xl font-bold tracking-tight text-login-50 md:text-4xl'>
                            {user.name || 'Anonymous User'}
                        </h2>
                        <div className='mt-3 flex flex-wrap justify-center gap-x-6 gap-y-2 text-login-100 md:justify-start'>
                            <div className='flex items-center gap-2 rounded-full border border-login-500 bg-login-700 px-3 py-1'>
                                <Mail className='size-4 text-login-200' />
                                <span className='text-sm'>{user.email}</span>
                            </div>
                            <div className='flex items-center gap-2 rounded-full border border-login-500 bg-login-700 px-3 py-1'>
                                <Calendar className='size-4 text-login-200' />
                                <span className='text-sm'>Joined {formatDateTime(user.created_at)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='grid grid-cols-1 gap-5 md:grid-cols-3'>
                    <Widget
                        href='/forms/create'
                        title='Create Form'
                        description='Start a new data collection project'
                        Icon={FilePlus}
                    />

                    <Widget
                        href='/forms'
                        title='My Forms'
                        description={formCount != 0 ?
                            `Manage your ${formCount} existing ${formCount == 1 ? 'form' : 'forms'}` :
                            'You have no forms yet.'}
                        Icon={Files}
                    />

                    <Widget
                        href='/submissions'
                        title='Submissions'
                        description={submissionCount != 0 ?
                            `Analyze ${submissionCount} ${submissionCount == 1 ? 'submission' : 'submissions'}` :
                            'You have no submissions yet.'}
                        Icon={FileText}
                    />
                </div>

                <div className='mt-12 border-t border-login-500 pt-8'>
                    <h3 className='mb-6 flex items-center gap-2 text-xl font-semibold text-login-50'>
                        <UserIcon className='size-5 text-login-200' />
                        Account Settings
                    </h3>

                    <div className='card p-6'>
                        <div className='flex flex-col justify-between gap-4 md:flex-row md:items-center'>
                            <div>
                                <h4 className='font-medium text-login-50'>Delete Account</h4>
                                <p className='mt-1 text-sm text-login-100'>
                                    Permanently remove your account and all of your content.
                                </p>
                                <p className='mt-2 text-xs text-login-200'>
                                    Accounts inactive for more than 6 months are automatically deleted.
                                </p>
                            </div>
                            <Confirm />
                        </div>
                    </div>
                </div>
            </div>
        </PageContainer>
    )
}

type WidgetProps = {
    href: string
    title: string
    description: string
    Icon: React.ComponentType<{ className?: string }>
}

function Widget({ href, title, description, Icon }: WidgetProps) {
    return (
        <Link href={href} className={`group relative block size-full min-h-40 overflow-hidden
            rounded-2xl border border-login-500 bg-login-600 p-6 text-left
            transition-all duration-300 hover:-translate-y-1 hover:border-login-400 hover:shadow-xl`}>
            <div className={`absolute top-0 right-0 transform p-4 opacity-5
                transition-opacity duration-500 group-hover:scale-110 group-hover:opacity-10`}>
                <Icon className='size-20 text-login-50' />
            </div>
            <div className='relative z-10 flex h-full flex-col justify-between'>
                <div className='w-fit rounded-xl bg-login-500 p-3 transition-colors group-hover:bg-login-400'>
                    <Icon className='size-6 text-login-100 group-hover:text-login-50' />
                </div>
                <div>
                    <h3 className='mb-1 text-xl font-bold text-login-50'>{title}</h3>
                    <p className='text-sm font-medium text-login-100 transition-colors group-hover:text-white'>
                        {description}
                    </p>
                </div>
            </div>
        </Link>
    )
}
