'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Table, MenuButton, ConfirmPopup, toast } from 'uibee/components'
import { Edit, Trash, Settings, Shield, List, QrCode, Share, Copy, FilePlus2, MoreHorizontal } from 'lucide-react'
import MobileCard from './mobile-card'
import FormActionModal, { type ModalMode } from './form-action-modal'
import {
    deleteForm,
    duplicateForm,
    createTemplateFromForm,
    createFormFromTemplate,
    deleteTemplate
} from '@utils/api/client'
import { toDateTimeLocal } from '@utils/dateTime'

type FormsTableProps = {
    data: object[]
    variant?: 'default' | 'minimal'
    resourceType?: 'form' | 'template'
}

type ModalState = {
    id: string
    mode: ModalMode
    initialTitle: string
    initialSlug: string
    initialPublishedAt?: string
    initialExpiresAt?: string
}

type ConfirmDeleteState = {
    id: string
    type: 'form' | 'template'
}

export default function FormsTable({ data, variant = 'minimal', resourceType = 'form' }: FormsTableProps) {
    const router = useRouter()
    const isTemplate = resourceType === 'template'
    const [modal, setModal] = useState<ModalState | null>(null)
    const [confirmDelete, setConfirmDelete] = useState<ConfirmDeleteState | null>(null)

    function openModal(state: ModalState) {
        setModal(state)
    }

    async function handleConfirmDelete() {
        if (!confirmDelete) return
        try {
            if (confirmDelete.type === 'template') {
                await deleteTemplate(confirmDelete.id)
                toast.success('Template deleted')
            } else {
                await deleteForm(confirmDelete.id)
                toast.success('Form deleted')
            }
            router.refresh()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Unable to delete')
        } finally {
            setConfirmDelete(null)
        }
    }

    const actions = {
        edit: (id: string) => router.push(isTemplate ? `/template/${id}/fields` : `/form/${id}`),
        settings: (id: string) => router.push(isTemplate ? `/template/${id}/settings` : `/form/${id}/settings`),
        permissions: (id: string) => router.push(isTemplate ? `/template/${id}/permissions` : `/form/${id}/permissions`),
        submissions: (id: string) => router.push(`/form/${id}/submissions`),
        scanner: (id: string) => router.push(`/qr/${id}`),
        delete: (id: string) => {
            setConfirmDelete({ id, type: 'form' })
        },
        deleteTemplate: (id: string) => {
            setConfirmDelete({ id, type: 'template' })
        },
        duplicate: (id: string, title: string, slug: string) => {
            const now = new Date()
            openModal({
                id,
                mode: 'duplicate',
                initialTitle: title,
                initialSlug: `${slug}-copy`,
                initialPublishedAt: toDateTimeLocal(now),
                initialExpiresAt: toDateTimeLocal(new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)),
            })
        },
        createTemplate: (id: string, title: string, slug: string) => {
            openModal({ id, mode: 'save-as-template', initialTitle: title, initialSlug: `${slug}-template` })
        },
        useTemplate: (id: string, title: string, slug: string) => {
            const now = new Date()
            openModal({
                id,
                mode: 'use-template',
                initialTitle: title,
                initialSlug: `${slug}-copy`,
                initialPublishedAt: toDateTimeLocal(now),
                initialExpiresAt: toDateTimeLocal(new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)),
            })
        },
        share: (slug: string) => {
            const link = `${window.location.origin}/f/${slug}`
            navigator.clipboard.writeText(link)
            toast.success('Form link copied to clipboard!')
        }
    }

    async function handleModalSubmit(data: { title: string; slug: string; published_at: string; expires_at: string }) {
        if (!modal) return
        if (modal.mode === 'duplicate') {
            const created = await duplicateForm(modal.id, data)
            toast.success('Form duplicated')
            router.push(`/form/${created.id}/fields`)
        } else if (modal.mode === 'save-as-template') {
            const created = await createTemplateFromForm(modal.id, { title: data.title, slug: data.slug })
            toast.success('Template created')
            router.push(`/template/${created.id}/fields`)
        } else {
            const created = await createFormFromTemplate(modal.id, data)
            toast.success('Form created from template')
            router.push(`/form/${created.id}/fields`)
        }
    }

    return (
        <>
            <div className='hidden md:block'>
                <Table
                    data={data}
                    variant={variant}
                    columns={[
                        { key: 'title' },
                        { key: 'id' },
                        { key: 'created_at' },
                    ]}
                    idKey='id'
                    menuItems={renderMenuItems}
                    redirectPath={{ path: isTemplate ? '/template' : '/form', key: 'id' }}
                />
            </div>
            <div className='md:hidden'>
                {(data as (GetFormProps | GetTemplateProps)[]).map((item) => (
                    <FormsMobileCard
                        key={item.id}
                        item={item}
                        renderMenuItems={renderMenuItems}
                        actions={actions}
                    />
                ))}
            </div>

            {modal && (
                <FormActionModal
                    key={modal.id + modal.mode}
                    mode={modal.mode}
                    initialTitle={modal.initialTitle}
                    initialSlug={modal.initialSlug}
                    initialPublishedAt={modal.initialPublishedAt}
                    initialExpiresAt={modal.initialExpiresAt}
                    onSubmit={handleModalSubmit}
                    onClose={() => setModal(null)}
                />
            )}

            <ConfirmPopup
                isOpen={confirmDelete !== null}
                header={`Delete ${confirmDelete?.type === 'template' ? 'Template' : 'Form'}`}
                description='This action cannot be undone.'
                confirmText='Delete'
                cancelText='Cancel'
                variant='danger'
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmDelete(null)}
            />
        </>
    )

    function FormsMobileCard({ item, renderMenuItems, actions }: {
        item: GetFormProps | GetTemplateProps,
        renderMenuItems: (item: GetFormProps | GetTemplateProps | object, id: string) => React.ReactNode,
        actions: { edit: (id: string) => void }
    }) {
        const [showActions, setShowActions] = useState(false)

        return (
            <MobileCard
                key={item.id}
                title={item.title}
                subtitle={item.id}
                details={[
                    { label: 'Created', value: item.created_at }
                ]}
                actions={
                    <div className='relative'>
                        <button
                            className='flex min-h-11 min-w-11 items-center justify-center p-3 text-login-300 hover:text-login-100'
                            onClick={(e) => {
                                e.stopPropagation()
                                setShowActions(!showActions)
                            }}
                        >
                            <MoreHorizontal size={20} />
                        </button>
                        {showActions && (
                            <>
                                <div
                                    className='fixed inset-0 z-40'
                                    onClick={(e) => { e.stopPropagation(); setShowActions(false) }}
                                />
                                <div
                                    className='absolute right-0 z-50 mt-2 flex w-48
                                        flex-col rounded-lg border border-login-600 bg-login-800 p-1 shadow-xl'
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {renderMenuItems(item, item.id)}
                                </div>
                            </>
                        )}
                    </div>
                }
                onClick={() => actions.edit(item.id)}
            />
        )
    }

    function renderMenuItems(item: GetFormProps | GetTemplateProps | object, id: string) {
        const formItem = item as GetFormProps
        return (
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
                        onClick={() => actions.duplicate(id, formItem.title, formItem.slug)}
                    />
                )}
                {!isTemplate && (
                    <MenuButton
                        icon={<FilePlus2 />}
                        text='Template'
                        hotKey='T'
                        onClick={() => actions.createTemplate(id, formItem.title, formItem.slug)}
                    />
                )}
                {isTemplate && (
                    <MenuButton
                        icon={<Copy />}
                        text='Use Template'
                        hotKey='U'
                        onClick={() => actions.useTemplate(id, (item as GetTemplateProps).title, (item as GetTemplateProps).slug)}
                    />
                )}
                {!isTemplate && (
                    <MenuButton
                        icon={<Share />}
                        text='Share'
                        hotKey='C'
                        onClick={() => actions.share(formItem.slug)}
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
        )
    }
}
