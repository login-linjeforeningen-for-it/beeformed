import { getTemplates, getSharedTemplates } from '@utils/api/server'
import { PageContainer, SearchInput } from 'uibee/components'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Plus } from 'lucide-react'
import FormsTable from '@components/tables/forms'
import FAB from '@components/button/fab'
import ViewToggle from '@components/button/view-toggle'

type PageProps = {
    params: Promise<{ slug?: string[] | string }>
    searchParams: Promise<{ [key: string]: string | undefined }>
}

export default async function Page({ params, searchParams }: PageProps) {
    const param = await params
    const filters = await searchParams

    const slug = param.slug && (Array.isArray(param.slug) ? param.slug[0] : param.slug) || 'templates'
    const listType: 'templates' | 'shared' = slug === 'shared' ? 'shared' : 'templates'

    const search = typeof filters.q === 'string' ? filters.q : ''
    const page = typeof filters.page === 'string' ? Number(filters.page) : 1
    const limit = 14
    const offset = (page - 1) * limit
    const orderBy = typeof filters.column === 'string' ? filters.column : 'created_at'
    const sort: 'asc' | 'desc' = typeof filters.order === 'string' && (filters.order === 'asc' || filters.order === 'desc')
        ? filters.order
        : 'asc'

    const filter = {
        search,
        offset,
        limit,
        orderBy,
        sort
    }

    let templates
    try {
        templates = listType === 'shared' ? await getSharedTemplates(filter) : await getTemplates(filter)
    } catch {
        notFound()
    }

    const totalItems = templates.total

    return (
        <PageContainer title='Templates'>
            <div className='mb-4'>
                <ViewToggle
                    current={listType}
                    left={{ value: 'templates', text: 'My Templates', path: '/templates' }}
                    right={{ value: 'shared', text: 'Shared Templates', path: '/templates/shared' }}
                />
            </div>
            <div className='flex h-full flex-col pt-6 pb-4'>
                <div
                    className='mb-4 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between'
                    style={{ viewTransitionName: 'list-controls' }}
                >
                    <div className='w-full md:w-auto'>
                        <SearchInput
                            placeholder='Search templates...'
                            variant='minimal'
                        />
                    </div>
                    {listType === 'templates' && (
                        <Link
                            href='/templates/create'
                            aria-label='Create template'
                            className='hidden items-center rounded p-2 transition-colors hover:bg-login-600 md:flex'
                        >
                            <Plus className='inline-block size-6' />
                        </Link>
                    )}
                </div>

                <div className='flex min-h-0 flex-1 flex-col'>
                    <FormsTable
                        data={templates.data}
                        resourceType='template'
                        totalRows={totalItems}
                    />
                </div>
            </div>
            {listType === 'templates' && <FAB href='/templates/create' label='Create Template' />}
        </PageContainer>
    )
}
