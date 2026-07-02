'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, MenuButton, Table, toast } from 'uibee/components'
import { Trash } from 'lucide-react'
import { deleteTemplatePermission, postTemplatePermission } from '@utils/api/client'
import { formatDateTime } from '@utils/dateTime'

export default function EditTemplatePermissionsPage({
    permissions,
    templateId
}: {
    permissions: GetTemplatePermissionsProps
    templateId: string
}) {
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
            await postTemplatePermission(templateId, {
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

    async function handleDeletePermission(currentTemplateId: string, permissionId: string) {
        try {
            await deleteTemplatePermission(currentTemplateId, permissionId)
            toast.success('Permission deleted successfully!')
            router.refresh()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to delete permission')
        }
    }

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
                    Adding permissions grants users or groups the ability to edit this template.
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
                        <Button
                            text={loading ? 'Adding...' : 'Add Permission'}
                            type='submit'
                            disabled={loading || neitherFilled || bothFilled}
                            variant='primary'
                            className='flex-1'
                        />
                    </div>
                </form>
            </div>

            <div className='w-full max-w-2xl'>
                <h2 className='mb-6 text-xl font-semibold text-login-50'>Current Permissions</h2>

                {permissions && permissions.data.length > 0 ? (
                    <Table
                        data={transformedData}
                        columns={[
                            { key: 'user_or_group', label: 'User/Group' },
                            { key: 'granted_by_email', label: 'Granted By' },
                            { key: 'created_at', label: 'Created At' }
                        ]}
                        variant='modern'
                        idKey='id'
                        menuItems={(row) => (
                            <MenuButton
                                icon={<Trash />}
                                text='Delete'
                                hotKey='D'
                                onClick={() => handleDeletePermission(templateId, row.id as string)}
                                className='text-red-400'
                            />
                        )}
                    />
                ) : (
                    <p className='text-login-200'>No permissions found.</p>
                )}
            </div>
        </div>
    )
}
