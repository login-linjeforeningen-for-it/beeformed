import { PageContainer } from '@components/container/page'
import { getUser, getForms, getUserSubmissions } from '@utils/api'
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
                <div className='w-full max-w-3xl mx-auto'>
                    <div className='p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 flex items-center gap-3'>
                        <div className='p-2 bg-red-500/20 rounded-full'>
                            <UserIcon className='w-5 h-5' />
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
            <div className='w-full max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700'>

                <div className={`relative overflow-hidden bg-login-900/50 backdrop-blur-sm 
                    border border-login-800 rounded-3xl p-6 md:p-10 flex flex-col md:flex-row 
                    items-center md:items-start gap-8`}>

                    <div className={`absolute top-0 right-0 w-64 h-64 bg-login-500/5 rounded-full 
                        blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none`} />

                    <div className='relative group'>
                        <div className={`w-24 h-24 md:w-32 md:h-32 rounded-full bg-linear-to-br 
                            from-login-500 to-login-600 flex items-center justify-center 
                            text-3xl md:text-5xl font-bold text-white shadow-xl ring-4 
                            ring-login-800 group-hover:scale-105 transition-transform duration-300`}>
                            {userInitials}
                        </div>
                    </div>

                    <div className='flex-1 flex flex-col items-center md:items-start text-center md:text-left z-10'>
                        <h2 className='text-3xl md:text-4xl font-bold text-login-50 tracking-tight'>
                            {user.name || 'Anonymous User'}
                        </h2>
                        <div className='flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 mt-3 text-login-300'>
                            <div className='flex items-center gap-2 px-3 py-1 rounded-full bg-login-800/50 border border-login-700/50'>
                                <Mail className='w-4 h-4 text-login-400' />
                                <span className='text-sm'>{user.email}</span>
                            </div>
                            <div className='flex items-center gap-2 px-3 py-1 rounded-full bg-login-800/50 border border-login-700/50'>
                                <Calendar className='w-4 h-4 text-login-400' />
                                <span className='text-sm'>Joined {formatDateTime(user.created_at)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-5'>
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

                <div className='mt-12 pt-8 border-t border-login-800'>
                    <h3 className='text-xl font-semibold text-login-50 mb-6 flex items-center gap-2'>
                        <UserIcon className='w-5 h-5 text-login-400' />
                        Account Settings
                    </h3>

                    <div className='bg-login-900/30 rounded-xl border border-login-800/50 p-6'>
                        <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                            <div>
                                <h4 className='font-medium text-login-50'>Delete Account</h4>
                                <p className='text-sm text-login-400 mt-1'>
                                    Permanently remove your account and all of your content.
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
        <Link href={href} className={`group relative w-full h-full min-h-40 bg-login-600 
            border border-login-700 hover:border-login-600 rounded-2xl p-6 text-left 
            transition-all duration-300 hover:shadow-xl hover:-translate-y-1 block overflow-hidden`}>
            <div className={`absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 
                transition-opacity transform group-hover:scale-110 duration-500`}>
                <Icon className='size-20 text-login-50' />
            </div>
            <div className='relative z-10 flex flex-col h-full justify-between'>
                <div className='p-3 bg-login-700 w-fit rounded-xl group-hover:bg-login-600 transition-colors'>
                    <Icon className='w-6 h-6 text-login-200 group-hover:text-login-50' />
                </div>
                <div>
                    <h3 className='text-xl font-bold text-login-50 mb-1'>{title}</h3>
                    <p className='text-login-400 group-hover:text-login-300 text-sm font-medium transition-colors'>
                        {description}
                    </p>
                </div>
            </div>
        </Link>
    )
}
