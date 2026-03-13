'use client'

import { useRouter } from 'next/navigation'
import { Table, MenuButton } from 'uibee/components'
import { Edit, Trash, Settings, Shield, List, QrCode, Share } from 'lucide-react'
import { toast } from 'uibee/components'
import { deleteForm } from '@utils/api'

type FormsTableProps = {
    data: object[]
    variant?: 'default' | 'minimal'
}

export default function FormsTable({ data, variant = 'minimal' }: FormsTableProps) {
    const router = useRouter()

    const actions = {
        edit: (id: string) => router.push(`/form/${id}`),
        settings: (id: string) => router.push(`/form/${id}/settings`),
        permissions: (id: string) => router.push(`/form/${id}/permissions`),
        submissions: (id: string) => router.push(`/form/${id}/submissions`),
        scanner: (id: string) => router.push(`/qr/${id}`),
        delete: (id: string) => { deleteForm(id); router.refresh() },
        share: (slug: string) => {
            const link = `${window.location.origin}/f/${slug}`
            navigator.clipboard.writeText(link)
            toast.success('Form link copied to clipboard!')
        }
    }

    return (
        <Table
            data={data}
            variant={variant}
            columns={[
                { key: 'title' },
                { key: 'id' },
                { key: 'created_at' },
            ]}
            idKey='id'
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            menuItems={(item: any, id: string) => (
                <>
                    <MenuButton
                        icon={<Edit />}
                        text='Edit'
                        hotKey='E'
                        onClick={() => actions.edit(id)}
                    />
                    <MenuButton
                        icon={<Settings />}
                        text='Settings'
                        hotKey='S'
                        onClick={() => actions.settings(id)}
                    />
                    <MenuButton
                        icon={<Shield />}
                        text='Permissions'
                        hotKey='P'
                        onClick={() => actions.permissions(id)}
                    />
                    <MenuButton
                        icon={<List />}
                        text='Submissions'
                        hotKey='L'
                        onClick={() => actions.submissions(id)}
                    />
                    <MenuButton
                        icon={<QrCode />}
                        text='Scanner'
                        hotKey='Q'
                        onClick={() => actions.scanner(id)}
                    />
                    <MenuButton
                        icon={<Share />}
                        text='Share'
                        hotKey='C'
                        onClick={() => actions.share(item.slug)}
                    />
                    <MenuButton
                        icon={<Trash />}
                        text='Delete'
                        hotKey='D'
                        onClick={() => actions.delete(id)}
                        className='text-red-400'
                    />
                </>
            )}
            redirectPath={{ path: '/form', key: 'id' }}
        />
    )
}
