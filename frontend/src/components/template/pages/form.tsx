'use client'

import { useState } from 'react'
import { toast, Input, Switch, Textarea } from 'uibee/components'
import { useRouter } from 'next/navigation'
import { CalendarClock, FileText, Settings } from 'lucide-react'
import { postTemplate, putTemplate } from '@utils/api/client'

export default function EditTemplatePage({ template }: { template?: GetTemplateProps }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [templateData, setTemplateData] = useState({
        slug: template?.slug || '',
        title: template?.title || '',
        description: template?.description || '',
        anonymous_submissions: template?.anonymous_submissions || false,
        limit: template?.limit ? String(template.limit) : '',
        waitlist: template?.waitlist || false,
        multiple_submissions: template?.multiple_submissions || false,
        published_at: template?.published_at ? new Date(template.published_at).toISOString().slice(0, 16) : '',
        expires_at: template?.expires_at ? new Date(template.expires_at).toISOString().slice(0, 16) : ''
    })

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        try {
            const data = {
                slug: templateData.slug.toLowerCase(),
                title: templateData.title,
                description: templateData.description || null,
                anonymous_submissions: templateData.anonymous_submissions,
                limit: templateData.limit ? parseInt(templateData.limit) : null,
                waitlist: templateData.waitlist,
                multiple_submissions: templateData.multiple_submissions,
                published_at: templateData.published_at,
                expires_at: templateData.expires_at,
                source_form_id: template?.source_form_id || null
            }

            if (template?.id) {
                await putTemplate(template.id, data)
                toast.success('Template updated successfully!')
                router.refresh()
            } else {
                const result = await postTemplate(data)
                toast.success('Template created successfully!')
                router.push(`/templates/${result.id}/fields`)
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='w-full max-w-2xl'>
            <form onSubmit={handleSubmit} className='space-y-8'>
                <div className='space-y-4'>
                    <div className='flex items-center space-x-2 text-login-100 pb-2 border-b border-login-800/50'>
                        <FileText className='w-5 h-5 text-login-100' />
                        <h3 className='font-medium text-lg'>General Details</h3>
                    </div>

                    <div className='space-y-4 pl-1'>
                        <Input
                            name='title'
                            type='text'
                            label='Title'
                            value={templateData.title}
                            onChange={(e) => setTemplateData(prev => ({ ...prev, title: e.target.value }))}
                            required
                        />

                        <Textarea
                            name='description'
                            label='Description'
                            value={templateData.description}
                            onChange={(e) => setTemplateData(prev => ({ ...prev, description: e.target.value }))}
                            rows={5}
                            type='markdown'
                        />

                        <Input
                            name='slug'
                            type='text'
                            label='Slug (URL Identifier)'
                            value={templateData.slug}
                            onChange={(e) => {
                                const value = e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '')
                                setTemplateData(prev => ({ ...prev, slug: value }))
                            }}
                            required
                        />
                    </div>
                </div>

                <div className='space-y-4'>
                    <div className='flex items-center space-x-2 text-login-100 pb-2 border-b border-login-800/50'>
                        <Settings className='w-5 h-5 text-login-100' />
                        <h3 className='font-medium text-lg'>Configuration</h3>
                    </div>

                    <div className='space-y-4 pl-1'>
                        <Switch
                            name='anonymous_submissions'
                            label='Allow anonymous submissions'
                            checked={templateData.anonymous_submissions}
                            onChange={(e) => setTemplateData(prev => ({ ...prev, anonymous_submissions: e.target.checked }))}
                        />

                        <Switch
                            name='multiple_submissions'
                            label='Allow multiple submissions per user'
                            disabled={templateData.anonymous_submissions}
                            checked={templateData.anonymous_submissions ? true : templateData.multiple_submissions}
                            onChange={(e) => setTemplateData(prev => ({ ...prev, multiple_submissions: e.target.checked }))}
                        />

                        <div className='pt-2'>
                            <Input
                                name='limit'
                                type='number'
                                label='Submission limit'
                                value={templateData.limit}
                                onChange={(e) => setTemplateData(prev => ({ ...prev, limit: e.target.value }))}
                                placeholder='Unlimited'
                            />
                        </div>

                        <Switch
                            name='waitlist'
                            label='Enable waitlist when full'
                            checked={templateData.waitlist}
                            disabled={templateData.limit === '' || parseInt(templateData.limit) <= 0}
                            onChange={(e) => setTemplateData(prev => ({ ...prev, waitlist: e.target.checked }))}
                        />
                    </div>
                </div>

                <div className='space-y-4'>
                    <div className='flex items-center space-x-2 text-login-100 pb-2 border-b border-login-800/50'>
                        <CalendarClock className='w-5 h-5 text-login-100' />
                        <h3 className='font-medium text-lg'>Availability</h3>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 pl-1'>
                        <Input
                            name='published_at'
                            type='datetime-local'
                            label='Publish date'
                            value={templateData.published_at}
                            onChange={(e) => setTemplateData(prev => ({ ...prev, published_at: e.target.value }))}
                            required
                        />

                        <Input
                            name='expires_at'
                            type='datetime-local'
                            label='Expiration date'
                            value={templateData.expires_at}
                            onChange={(e) => setTemplateData(prev => ({ ...prev, expires_at: e.target.value }))}
                            required
                        />
                    </div>
                </div>

                <div className='flex flex-col sm:flex-row gap-3 pt-6 border-t border-login-800/30 mt-8'>
                    <button
                        type='submit'
                        disabled={loading || !templateData.title.trim() || !templateData.published_at || !templateData.expires_at}
                        className='flex-1 px-4 py-2 bg-login text-login-900 rounded-md
                            hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed
                            transition-colors focus:outline-none focus:ring-2 focus:ring-login
                            focus:ring-offset-2 focus:ring-offset-login-700 font-medium cursor-pointer'
                    >
                        {loading ? (template ? 'Updating...' : 'Creating...') : (template ? 'Update Template' : 'Create Template')}
                    </button>
                </div>
            </form>
        </div>
    )
}
