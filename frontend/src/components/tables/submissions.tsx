'use client'

import { cancelSubmission } from '@utils/api/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ConfirmPopup, MenuButton, Table, toast } from 'uibee/components'
import { Eye, QrCode, Trash } from 'lucide-react'
import { formatDateTime } from '@utils/dateTime'

interface SubmissionsTableProps {
    data: GetSubmissionsProps['data']
    totalRows?: number
}

type ConfirmCancelState = {
    row: GetSubmissionsProps['data'][number]
}

export default function SubmissionsTable({ data, totalRows }: SubmissionsTableProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [confirmCancel, setConfirmCancel] = useState<ConfirmCancelState | null>(null)

    function handleCancel(row: GetSubmissionsProps['data'][number]) {
        if (loading) return
        setConfirmCancel({ row })
    }

    async function handleConfirmCancel() {
        if (!confirmCancel) return
        setLoading(true)
        setConfirmCancel(null)
        try {
            await cancelSubmission(confirmCancel.row.id)
            router.refresh()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'An error occurred')
        } finally {
            setLoading(false)
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
        <>
            <ConfirmPopup
                isOpen={confirmCancel !== null}
                header={confirmCancel?.row.status === 'waitlisted' ? 'Leave Waitlist' : 'Cancel Submission'}
                description={confirmCancel?.row.status === 'waitlisted'
                    ? 'Are you sure you want to leave the waitlist? You will lose your spot.'
                    : 'Are you sure you want to cancel your submission? This cannot be undone.'}
                confirmText='Confirm'
                cancelText='Keep'
                variant='warning'
                onConfirm={handleConfirmCancel}
                onCancel={() => setConfirmCancel(null)}
            />
            <Table
                data={data}
                idKey='id'
                variant='modern'
                urlState
                pageSize={14}
                totalRows={totalRows}
                className='flex-1'
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
                    { key: 'submitted_at', label: 'Submitted At', sortable: true, render: (v) => formatDateTime(v as string) }
                ]}
                redirectPath={{ path: '/submissions', key: 'id' }}
                menuItems={renderMenuItems}
            />
        </>
    )

    function renderMenuItems(row: GetSubmissionsProps['data'][number], id: string) {
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
    }
}
