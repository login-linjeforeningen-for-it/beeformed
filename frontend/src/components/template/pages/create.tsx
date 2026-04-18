'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input, toast } from 'uibee/components'
import { postTemplate } from '@utils/api/client'

function toDateTimeLocal(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0')
    const year = date.getFullYear()
    const month = pad(date.getMonth() + 1)
    const day = pad(date.getDate())
    const hours = pad(date.getHours())
    const minutes = pad(date.getMinutes())
    return `${year}-${month}-${day}T${hours}:${minutes}`
}

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
            const now = new Date()
            const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
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
                published_at: toDateTimeLocal(now),
                expires_at: toDateTimeLocal(expires),
                source_form_id: null
            })

            toast.success('Template created')
            router.push(`/templates/${result.id}/fields`)
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

            <button
                type='button'
                onClick={handleCreate}
                disabled={loading || !title.trim()}
                className='px-4 py-2 bg-login text-login-900 rounded-md hover:bg-orange-400 disabled:opacity-50
                    disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-login
                    focus:ring-offset-2 focus:ring-offset-login-700 font-medium cursor-pointer'
            >
                {loading ? 'Creating...' : 'Create Template'}
            </button>
        </div>
    )
}
