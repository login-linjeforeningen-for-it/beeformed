'use client'

import { deleteUser } from '@utils/api'
import { TriangleAlert } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button, ConfirmPopup, toast } from 'uibee/components'

export default function Confirm() {
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()

    return (
        <>
            <ConfirmPopup
                isOpen={isOpen}
                header='Delete Form User'
                description='Are you sure you want to delete this user?'
                confirmText='Delete'
                cancelText='Cancel'
                onConfirm={
                    async () => {
                        setIsOpen(false)
                        try {
                            const response = await deleteUser()
                            if ('error' in response) {
                                toast.error(response.error as string)
                                return
                            }
                            toast.success('User deleted successfully')
                            router.push('/')
                        } catch (error) {
                            toast.error('An error occurred while deleting the user')
                            console.error(error)
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
            <Button
                text='Delete User'
                icon={<TriangleAlert />}
                onClick={() => setIsOpen(true)}
                className='mb-4 px-4 py-2 bg-red-800 hover:bg-red-900 outline-red-900 rounded w-fit'
            />
        </>
    )
}
