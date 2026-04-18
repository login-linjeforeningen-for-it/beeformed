'use client'

import { deleteUser } from '@utils/api/client'
import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button, ConfirmPopup, toast } from 'uibee/components'

export default function Confirm() {
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()

    return (
        <>
            <Button
                text='Delete Account'
                icon={<Trash2 className='w-4 h-4' />}
                onClick={() => setIsOpen(true)}
                variant='danger'
            />

            <ConfirmPopup
                isOpen={isOpen}
                header='Delete Account'
                description={`Are you sure you want to delete your account? This action cannot be undone.
                    Inactive accounts are also removed automatically after 6 months.
                    NB! This will not delete your SSO account (authentik)`}
                confirmText='Delete'
                cancelText='Cancel'
                onConfirm={
                    async () => {
                        setIsOpen(false)
                        try {
                            await deleteUser()
                            toast.success('Account deleted successfully')
                            router.push('/')
                        } catch (error) {
                            toast.error(error instanceof Error ? error.message : 'An error occurred while deleting the account')
                        }
                    }
                }
                onCancel={
                    () => {
                        setIsOpen(false)
                    }
                }
                variant='danger'
            />
        </>
    )
}
