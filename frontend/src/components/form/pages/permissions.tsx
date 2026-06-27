'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast, Input, Table, MenuButton } from 'uibee/components'
import { Trash } from 'lucide-react'
import { deletePermission, postPermission } from '@utils/api/client'
import { formatDateTime } from '@utils/dateTime'

export default function EditPermissionsPage({ permissions, formId }: { permissions: GetPermissionsProps, formId: string }) {
    const router = useRouter()

    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        group: ''
    })

    const userFilled = !!formData.email.trim()
    const groupFilled = !!formData.group.trim()
    const bothFilled = userFilled && groupFilled
    const neitherFilled = !userFilled && !groupFilled

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        try {
            await postPermission(formId, {
                user_email: formData.email || null,
                group: formData.group || null
            })

            toast.success('Permission added successfully!')
            setFormData({ email: '', group: '' })
            router.refresh()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to add permission')
        } finally {
            setLoading(false)
        }
    }

    async function handleDeletePermission(formId: string, permissionId: string) {
        try {
            await deletePermission(formId, permissionId)
            toast.success('Permission deleted successfully!')
            router.refresh()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to delete permission')
        }
    }

    const columns = [
        { key: 'user_or_group', label: 'User/Group' },
        { key: 'granted_by_email', label: 'Granted By' },
        { key: 'created_at', label: 'Created At' }
    ]

    const transformedData = permissions.data.map(perm => ({
        ...perm,
        created_at: formatDateTime(perm.created_at),
        user_or_group: perm.user_email || perm.group
    }))

    return (
        <div className='w-full min-w-0 space-y-6'>
            <div className='w-full max-w-2xl'>
                <h2 className='mb-6 text-xl font-semibold text-login-50'>Add Permission</h2>
                <p className='mb-6 text-login-200'>
                    Adding permissions grants users or groups the ability to edit the form and manage submissions.
                </p>

                <form onSubmit={handleSubmit} className='space-y-4'>
                    <Input
                        name='email'
                        type='text'
                        label='Email'
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    />

                    <Input
                        name='group'
                        type='text'
                        label='Group'
                        value={formData.group}
                        onChange={(e) => setFormData(prev => ({ ...prev, group: e.target.value }))}
                    />

                    {bothFilled && (
                        <p className='text-sm text-red-400'>Email or Group, not both.</p>
                    )}

                    <div className='flex flex-col gap-3 pt-4 sm:flex-row'>
                        <button
                            type='submit'
                            disabled={loading || neitherFilled || bothFilled}
                            className='flex-1 cursor-pointer rounded-md bg-login px-4 py-3
                                font-medium text-white transition-colors
                                hover:bg-orange-400 focus:ring-2 focus:ring-login focus:ring-offset-2
                                focus:ring-offset-login-700 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'
                        >
                            {loading ? 'Adding...' : 'Add Permission'}
                        </button>
                    </div>
                </form>
            </div>

            <div className='w-full max-w-2xl'>
                <h2 className='mb-6 text-xl font-semibold text-login-50'>Current Permissions</h2>

                {permissions && permissions.data.length > 0 ? (
                    <Table
                        data={transformedData}
                        columns={columns}
                        variant='minimal'
                        idKey='id'
                        menuItems={(item: object) => {
                            const row = item as { id: string }
                            return (
                                <MenuButton
                                    icon={<Trash />}
                                    text='Delete'
                                    hotKey='D'
                                    onClick={() => handleDeletePermission(formId, row.id)}
                                    className='text-red-400'
                                />
                            )
                        }}
                    />
                ) : (
                    <p className='text-login-200'>No permissions found.</p>
                )}
            </div>
        </div>
    )
}
