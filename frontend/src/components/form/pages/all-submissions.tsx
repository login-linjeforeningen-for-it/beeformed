'use client'

import { useState } from 'react'
import { Select, Button } from 'uibee/components'
import { formatDateTime } from '@utils/dateTime'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

type AllSubmissionsPageProps = {
    submissions: GetSubmissionsProps
    currentOrderBy?: string
    currentSort?: 'asc' | 'desc'
}

export default function AllSubmissionsPage({ submissions }: AllSubmissionsPageProps) {
    const router = useRouter()
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const fields = submissions.fields || []

    const filteredSubmissions = submissions.data.filter(submission =>
        statusFilter === 'all' || submission.status === statusFilter
    )

    const submissionsData = filteredSubmissions.map(submission => {
        const row: Record<string, unknown> = {
            ...submission,
            user_email: submission.user_email || 'Anonymous',
            user_name: submission.user_name || 'Anonymous',
            submitted_at: formatDateTime(submission.submitted_at)
        }

        submission.answers?.forEach(answer => {
            row[`field_${answer.field_id}`] = answer.value
        })

        return row
    })

    function downloadCSV() {
        const sortedFields = fields.sort((a, b) => a.field_order - b.field_order)
        const headers = ['Submitted At', 'User Email', 'User Name', 'Status', 'Scanned', ...sortedFields.map(f => f.title)]
        const csvContent = [
            headers.join(','),
            ...submissionsData.map(row => [
                `"${row.submitted_at}"`,
                `"${row.user_email}"`,
                `"${row.user_name}"`,
                `"${row.status}"`,
                `"${row.scanned_at !== null ? 'Yes' : 'No'}"`,
                ...sortedFields.map(f => `"${(row[`field_${f.id}`] as string) || ''}"`)
            ].join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('download', 'submissions.csv')
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const sortedFields = fields.sort((a, b) => a.field_order - b.field_order)

    return (
        <div className='flex size-full flex-col pb-4'>
            <div className='mb-4 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center'>
                <Button
                    text='Back'
                    onClick={() => router.back()}
                    icon={<ArrowLeft className='size-5' />}
                    className='h-10.5 px-4 py-2'
                />
                <div className='flex flex-col items-stretch gap-2 sm:flex-row sm:items-start'>
                    <div className='w-full sm:w-48'>
                        <Select
                            name='statusFilter'
                            placeholder='Select Status'
                            value={statusFilter}
                            onChange={(value) => setStatusFilter(value as string)}
                            options={[
                                { value: 'all', label: 'Show All' },
                                { value: 'registered', label: 'Registered' },
                                { value: 'waitlisted', label: 'Waitlisted' },
                                { value: 'rejected', label: 'Rejected' },
                                { value: 'cancelled', label: 'Cancelled' }
                            ]}
                        />
                    </div>
                    <Button
                        onClick={downloadCSV}
                        text='Download CSV'
                        variant='secondary'
                        icon={<></>}
                        className='h-10.5 w-full border-login-500! bg-login-500/50! px-4 py-2 sm:w-auto'
                    />
                </div>
            </div>
            <div className='flex-1 space-y-6 overflow-y-auto'>
                {sortedFields.map(field => {
                    const answers = filteredSubmissions.map(s => {
                        const answer = s.answers?.find(a => a.field_id === field.id)
                        return answer ? answer.value : null
                    }).filter(val => val !== null && val !== '')

                    return (
                        <div key={field.id} className='rounded-lg border border-login-500 bg-login-700 p-4 sm:p-6'>
                            <div className='mb-4 border-b border-login-500 pb-2'>
                                <h2 className='text-lg font-semibold text-login-50'>{field.title}</h2>
                                {field.description && <p className='mt-1 text-sm text-login-200'>{field.description}</p>}
                            </div>

                            <div className='space-y-2'>
                                {answers.length === 0 ? (
                                    <p className='text-sm text-login-200 italic'>No answers provided</p>
                                ) : (
                                    <ul className='list-none space-y-2'>
                                        {answers.map((ans, idx) => (
                                            <li
                                                key={idx}
                                                className='rounded border  border-login-500 bg-login-500/50 p-3 text-sm text-login-50'
                                            >
                                                {ans}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
