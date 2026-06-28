'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, toast } from 'uibee/components'
import { postTemplate } from '@utils/api/client'

export default function CreateTemplateButton() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState('')

    function slugify(text: string): string {
        return text
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
    }

    async function handleCreate() {
        const trimmedTitle = title.trim()
        if (!trimmedTitle) {
            toast.error('Title is required')
            return
        }

        setLoading(true)

        try {
            const suffix = Date.now().toString(36)
            const slugBase = slugify(trimmedTitle) || 'template'

            const result = await postTemplate({
                title: trimmedTitle,
                slug: `${slugBase}-${suffix}`,
                description: null,
                anonymous_submissions: false,
                limit: null,
                waitlist: false,
                multiple_submissions: false,
                source_form_id: null
            })

            toast.success('Template created')
            router.push(`/template/${result.id}/fields`)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Unable to create template')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='space-y-4'>
            <Input
                name='title'
                type='text'
                label='Title'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
            />

            <Button
                text={loading ? 'Creating...' : 'Create Template'}
                type='button'
                onClick={handleCreate}
                disabled={loading || !title.trim()}
                variant='primary'
            />
        </div>
    )
}
