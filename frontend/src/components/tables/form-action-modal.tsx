'use client'

import { useState } from 'react'
import { Button, Input, toast } from 'uibee/components'
import { toISOWithOffset } from '@utils/dateTime'

export type ModalMode = 'duplicate' | 'save-as-template' | 'use-template'

type FormActionModalProps = {
    mode: ModalMode
    initialTitle: string
    initialSlug: string
    initialPublishedAt?: string
    initialExpiresAt?: string
    onSubmit: (data: { title: string; slug: string; published_at: string; expires_at: string }) => Promise<void>
    onClose: () => void
}

const TITLES: Record<ModalMode, string> = {
    'duplicate': 'Duplicate Form',
    'save-as-template': 'Save as Template',
    'use-template': 'Create Form from Template',
}

const SUBMIT_LABELS: Record<ModalMode, [string, string]> = {
    'duplicate': ['Duplicate', 'Duplicating...'],
    'save-as-template': ['Save', 'Saving...'],
    'use-template': ['Create', 'Creating...'],
}

export default function FormActionModal({
    mode,
    initialTitle,
    initialSlug,
    initialPublishedAt = '',
    initialExpiresAt = '',
    onSubmit,
    onClose,
}: FormActionModalProps) {
    const [title, setTitle] = useState(initialTitle)
    const [slug, setSlug] = useState(initialSlug)
    const [publishedAt, setPublishedAt] = useState(initialPublishedAt)
    const [expiresAt, setExpiresAt] = useState(initialExpiresAt)
    const [loading, setLoading] = useState(false)

    const showDates = mode !== 'save-as-template'
    const [submitLabel, loadingLabel] = SUBMIT_LABELS[mode]
    const isValid = title && slug && (!showDates || (publishedAt && expiresAt))

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        try {
            await onSubmit({
                title,
                slug,
                published_at: toISOWithOffset(publishedAt),
                expires_at: toISOWithOffset(expiresAt),
            })
            onClose()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div
            className='fixed inset-0 z-50 flex items-center justify-center bg-black/60'
            onClick={onClose}
        >
            <div className='mx-4 w-full max-w-sm card p-6 shadow-xl' onClick={(e) => e.stopPropagation()}>
                <h2 className='mb-4 text-lg font-semibold text-login-100'>{TITLES[mode]}</h2>
                <form onSubmit={handleSubmit} className='space-y-4'>
                    <Input
                        name='title'
                        type='text'
                        label='Title'
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                    <Input
                        name='slug'
                        type='text'
                        label='Slug'
                        value={slug}
                        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                        required
                    />
                    {showDates && (<>
                        <Input
                            name='published_at'
                            type='datetime-local'
                            label='Publish date'
                            value={publishedAt}
                            onChange={(e) => setPublishedAt(e.target.value)}
                            required
                        />
                        <Input
                            name='expires_at'
                            type='datetime-local'
                            label='Expiration date'
                            value={expiresAt}
                            onChange={(e) => setExpiresAt(e.target.value)}
                            required
                        />
                    </>)}
                    <div className='flex gap-3 pt-2'>
                        <Button
                            text='Cancel'
                            type='button'
                            onClick={onClose}
                            disabled={loading}
                            variant='secondary'
                            className='flex-1'
                        />
                        <Button
                            text={loading ? loadingLabel : submitLabel}
                            type='submit'
                            disabled={loading || !isValid}
                            variant='primary'
                            className='flex-1'
                        />
                    </div>
                </form>
            </div>
        </div>
    )
}
