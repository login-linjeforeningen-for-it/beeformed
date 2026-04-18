'use client'

import { useRouter } from 'next/navigation'
import { Table, MenuButton } from 'uibee/components'
import { Edit, Trash, Settings, Shield, List, QrCode, Share, Copy, FilePlus2 } from 'lucide-react'
import { toast } from 'uibee/components'
import {
    deleteForm,
    duplicateForm,
    createTemplateFromForm,
    createFormFromTemplate,
    deleteTemplate
} from '@utils/api/client'

type FormsTableProps = {
    data: object[]
    variant?: 'default' | 'minimal'
    resourceType?: 'form' | 'template'
}

export default function FormsTable({ data, variant = 'minimal', resourceType = 'form' }: FormsTableProps) {
    const router = useRouter()
    const isTemplate = resourceType === 'template'

    const actions = {
        edit: (id: string) => router.push(isTemplate ? `/templates/${id}/fields` : `/form/${id}`),
        settings: (id: string) => router.push(isTemplate ? `/templates/${id}/settings` : `/form/${id}/settings`),
        permissions: (id: string) => router.push(isTemplate ? `/templates/${id}/permissions` : `/form/${id}/permissions`),
        submissions: (id: string) => router.push(`/form/${id}/submissions`),
        scanner: (id: string) => router.push(`/qr/${id}`),
        delete: async (id: string) => {
            try {
                await deleteForm(id)
                toast.success('Form deleted')
                router.refresh()
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Unable to delete form')
            }
        },
        deleteTemplate: async (id: string) => {
            try {
                await deleteTemplate(id)
                toast.success('Template deleted')
                router.refresh()
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Unable to delete template')
            }
        },
        duplicate: async (id: string) => {
            try {
                const duplicated = await duplicateForm(id)
                toast.success('Form duplicated')
                router.push(`/form/${duplicated.id}/fields`)
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Unable to duplicate form')
            }
        },
        createTemplate: async (id: string) => {
            try {
                const template = await createTemplateFromForm(id)
                toast.success('Template created')
                router.push(`/templates/${template.id}/fields`)
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Unable to create template')
            }
        },
        useTemplate: async (id: string) => {
            try {
                const created = await createFormFromTemplate(id)
                toast.success('Form created from template')
                router.push(`/form/${created.id}/fields`)
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Unable to use template')
            }
        },
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
                    {!isTemplate && (
                        <MenuButton
                            icon={<Settings />}
                            text='Settings'
                            hotKey='S'
                            onClick={() => actions.settings(id)}
                        />
                    )}
                    <MenuButton
                        icon={<Shield />}
                        text='Permissions'
                        hotKey='P'
                        onClick={() => actions.permissions(id)}
                    />
                    {!isTemplate && (
                        <MenuButton
                            icon={<List />}
                            text='Submissions'
                            hotKey='L'
                            onClick={() => actions.submissions(id)}
                        />
                    )}
                    {!isTemplate && (
                        <MenuButton
                            icon={<QrCode />}
                            text='Scanner'
                            hotKey='Q'
                            onClick={() => actions.scanner(id)}
                        />
                    )}
                    {!isTemplate && (
                        <MenuButton
                            icon={<Copy />}
                            text='Duplicate'
                            hotKey='U'
                            onClick={() => actions.duplicate(id)}
                        />
                    )}
                    {!isTemplate && (
                        <MenuButton
                            icon={<FilePlus2 />}
                            text='Template'
                            hotKey='T'
                            onClick={() => actions.createTemplate(id)}
                        />
                    )}
                    {isTemplate && (
                        <MenuButton
                            icon={<Copy />}
                            text='Use Template'
                            hotKey='U'
                            onClick={() => actions.useTemplate(id)}
                        />
                    )}
                    {!isTemplate && (
                        <MenuButton
                            icon={<Share />}
                            text='Share'
                            hotKey='C'
                            onClick={() => actions.share(item.slug)}
                        />
                    )}
                    <MenuButton
                        icon={<Trash />}
                        text='Delete'
                        hotKey='D'
                        onClick={() => isTemplate ? actions.deleteTemplate(id) : actions.delete(id)}
                        className='text-red-400'
                    />
                </>
            )}
            redirectPath={{ path: isTemplate ? '/templates' : '/form', key: 'id' }}
        />
    )
}
