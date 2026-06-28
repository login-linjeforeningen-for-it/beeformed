'use client'

import { useRouter } from 'next/navigation'
import { Button, MenuButton, Pagination, SearchInput, Table } from 'uibee/components'
import { Eye } from 'lucide-react'
import { formatDateTime } from '@utils/dateTime'

type SubmissionsPageProps = {
    submissions: GetSubmissionsProps
    currentOrderBy?: string
    currentSort?: 'asc' | 'desc'
    formId?: string
}

export default function SubmissionsPage({ submissions, formId }: SubmissionsPageProps) {
    const router = useRouter()
    const submissionsData = submissions.data.map(submission => ({
        ...submission,
        user_email: submission.user_email || 'Anonymous',
        user_name: submission.user_name || 'Anonymous',
        submitted_at: formatDateTime(submission.submitted_at),
        scanned_at: submission.scanned_at ? formatDateTime(submission.scanned_at) : 'Not Scanned'
    }))

    return (
        <div className='flex size-full flex-col'>
            <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <SearchInput
                    placeholder='Search submissions...'
                    variant='minimal'
                />
                {formId && (
                    <Button
                        text='View All'
                        path={`/form/${formId}/all-submissions`}
                        variant='primary'
                    />
                )}
            </div>
            {submissionsData.length === 0 ? (
                <div className='flex min-h-0 flex-1 flex-col items-center justify-center'>
                    <p className='text-center text-gray-500'>
                        No submissions found
                    </p>
                </div>
            ) : (
                <div className='flex min-h-0 flex-1 flex-col justify-between'>
                    <Table
                        data={submissionsData}
                        idKey='id'
                        variant='minimal'
                        columns={[
                            { key: 'submitted_at', label: 'Submitted At', sortable: true },
                            { key: 'user_email', label: 'User Email' },
                            { key: 'user_name', label: 'User Name' },
                            {
                                key: 'status',
                                label: 'Status',
                                sortable: true,
                                highlight: {
                                    'registered': 'green',
                                    'waitlisted': 'yellow',
                                    'cancelled': 'gray',
                                    'rejected': 'red'
                                }
                            },
                            { key: 'scanned_at', label: 'Scanned At', sortable: true }
                        ]}
                        redirectPath={{ path: '/submissions', key: 'id' }}
                        menuItems={(_: object, id: string) => (
                            <MenuButton
                                icon={<Eye />}
                                text='View'
                                hotKey='V'
                                onClick={() => router.push(`/submissions/${id}`)}
                            />
                        )}
                    />
                    <Pagination pageSize={14} totalRows={submissions.total} />
                </div>
            )}
        </div>
    )
}
