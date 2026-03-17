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
        <div className='pt-8 md:pt-20 pb-4 flex flex-col w-full h-full'>
            <div className='flex flex-col sm:flex-row justify-between mb-4 items-stretch sm:items-center gap-3'>
                <Button
                    text='Back'
                    onClick={() => router.back()}
                    icon={<ArrowLeft className='size-5' />}
                    className='px-4 py-2 h-10.5'
                />
                <div className='flex flex-col sm:flex-row gap-2 items-stretch sm:items-start'>
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
                        className='px-4 py-2 h-10.5 bg-login-500/50! border-login-500! w-full sm:w-auto'
                    />
                </div>
            </div>
            <div className='flex-1 overflow-y-auto space-y-6'>
                {sortedFields.map(field => {
                    const answers = filteredSubmissions.map(s => {
                        const answer = s.answers?.find(a => Number(a.field_id) === Number(field.id))
                        return answer ? answer.value : null
                    }).filter(val => val !== null && val !== '')

                    return (
                        <div key={field.id} className='bg-login-700 p-4 sm:p-6 rounded-lg border border-login-500'>
                            <div className='mb-4 border-b border-login-500 pb-2'>
                                <h2 className='text-lg font-semibold text-login-50'>{field.title}</h2>
                                {field.description && <p className='text-login-200 text-sm mt-1'>{field.description}</p>}
                            </div>

                            <div className='space-y-2'>
                                {answers.length === 0 ? (
                                    <p className='text-login-300 italic text-sm'>No answers provided</p>
                                ) : (
                                    <ul className='list-none space-y-2'>
                                        {answers.map((ans, idx) => (
                                            <li
                                                key={idx}
                                                className='text-login-50 bg-login-500/50  p-3 rounded text-sm border border-login-500'
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
