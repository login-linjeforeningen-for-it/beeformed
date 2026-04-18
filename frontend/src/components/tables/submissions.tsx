'use client'

import { cancelSubmission } from '@utils/api/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { MenuButton, Table, toast } from 'uibee/components'
import { Eye, QrCode, Trash } from 'lucide-react'

interface SubmissionsTableProps {
    data: GetSubmissionsProps['data']
}


export default function SubmissionsTable({ data }: SubmissionsTableProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    async function handleCancel(row: GetSubmissionsProps['data'][number]) {
        if (loading) return

        const isWaitlisted = row.status === 'waitlisted'
        const message = isWaitlisted
            ? 'Are you sure you want to leave the waitlist? You will lose your spot.'
            : 'Are you sure you want to cancel your submission? This cannot be undone.'

        if (confirm(message)) {
            setLoading(true)
            try {
                await cancelSubmission(row.id)
                router.refresh()
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'An error occurred')
            } finally {
                setLoading(false)
            }
        }
    }

    function canCancel(row: GetSubmissionsProps['data'][number]) {
        const expiresAt = row.expires_at
        if (!expiresAt) return true
        return new Date(expiresAt) >= new Date()
    }

    function handleShowQR(id: string) {
        router.push(`/submissions/qr/${id}`)
    }

    return (
        <Table
            data={data}
            idKey='id'
            variant='minimal'
            columns={[
                { key: 'form_title' },
                {
                    key: 'status',
                    highlight: {
                        'registered': 'green',
                        'waitlisted': 'yellow',
                        'cancelled': 'gray',
                        'rejected': 'red'
                    }
                },
                { key: 'submitted_at', label: 'Submitted At', sortable: true }
            ]}
            redirectPath={{ path: '/submissions', key: 'id' }}
            menuItems={(item: object, id: string) => {
                const row = item as GetSubmissionsProps['data'][number]
                return (
                    <>
                        <MenuButton
                            icon={<Eye />}
                            text='View'
                            hotKey='V'
                            onClick={() => router.push(`/submissions/${id}`)}
                        />
                        <MenuButton
                            icon={<QrCode />}
                            text='QR Code'
                            hotKey='Q'
                            onClick={() => handleShowQR(id)}
                        />
                        {canCancel(row) && (
                            <MenuButton
                                icon={<Trash />}
                                text='Cancel'
                                hotKey='C'
                                onClick={() => handleCancel(row)}
                                className='text-red-400'
                            />
                        )}
                    </>
                )
            }}
        />
    )
}
