'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Table, MenuButton, Pagination } from 'uibee/components'
import { Eye } from 'lucide-react'
import SearchInput from '@components/inputs/search'
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
        <div className='flex flex-col w-full h-full'>
            <div className='flex justify-between mb-4'>
                <SearchInput placeholder='Search submissions...' />
                {formId && (
                    <Link
                        href={`/form/${formId}/all-submissions`}
                        className='bg-login text-white px-4 py-2 rounded hover:bg-login-600 transition-colors ml-4 flex items-center'
                    >
                        View All
                    </Link>
                )}
            </div>
            {submissionsData.length === 0 ? (
                <div className='flex-1 flex flex-col items-center justify-center min-h-0'>
                    <p className='text-gray-500 text-center'>
                        No submissions found
                    </p>
                </div>
            ) : (
                <div className='flex-1 flex flex-col justify-between min-h-0'>
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
