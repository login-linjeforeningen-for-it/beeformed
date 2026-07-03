'use client'

import { useRouter } from 'next/navigation'
import { Button, MenuButton, SearchInput, Table } from 'uibee/components'
import { Eye } from 'lucide-react'
import { formatDateTime } from '@utils/dateTime'

type SubmissionsPageProps = {
    submissions: GetSubmissionsProps
    formId?: string
}

export default function SubmissionsPage({ submissions, formId }: SubmissionsPageProps) {
    const router = useRouter()

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
            <Table
                data={submissions.data}
                idKey='id'
                variant='modern'
                urlState
                pageSize={14}
                totalRows={submissions.total}
                columns={[
                    { key: 'submitted_at', label: 'Submitted At', sortable: true, render: (v) => formatDateTime(v as string) },
                    { key: 'user_email', label: 'User Email', render: (v) => (v as string) || 'Anonymous' },
                    { key: 'user_name', label: 'User Name', render: (v) => (v as string) || 'Anonymous' },
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
                    { key: 'scanned_at', label: 'Scanned At', sortable: true, render: (v) => v ? formatDateTime(v as string) : 'Not Scanned' }
                ]}
                redirectPath={{ path: '/submissions', key: 'id' }}
                menuItems={(_, id) => (
                    <MenuButton
                        icon={<Eye />}
                        text='View'
                        hotKey='V'
                        onClick={() => router.push(`/submissions/${id}`)}
                    />
                )}
            />
        </div>
    )
}
