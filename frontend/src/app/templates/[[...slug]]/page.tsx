import { getTemplates, getSharedTemplates } from '@utils/api/server'
import { Pagination, PageContainer, SearchInput } from 'uibee/components'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatDateTime } from '@utils/dateTime'
import { Plus } from 'lucide-react'
import FormsTable from '@components/tables/forms'

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

    const templateData = templates.data.map(template => ({
        ...template,
        created_at: formatDateTime(template.created_at)
    }))
    const totalItems = templates.total

    return (
        <PageContainer title='Templates'>
            <div className='flex flex-wrap gap-2 sm:gap-4 mb-4'>
                <Link
                    href='/templates'
                    className={`px-4 py-2 rounded transition-colors text-sm sm:text-base ${
                        listType === 'templates'
                            ? 'bg-login text-white'
                            : 'bg-login-700 text-login-100 hover:bg-login-600'
                    }`}
                >
                    My Templates
                </Link>
                <Link
                    href='/templates/shared'
                    className={`px-4 py-2 rounded transition-colors text-sm sm:text-base ${
                        listType === 'shared'
                            ? 'bg-login text-white'
                            : 'bg-login-700 text-login-100 hover:bg-login-600'
                    }`}
                >
                    Shared Templates
                </Link>
            </div>
            <div className='pt-6 pb-4 flex flex-col h-full'>
                <div className='flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 mb-4'>
                    <div className='w-full md:w-auto'>
                        <SearchInput
                            placeholder='Search templates...'
                            variant='minimal'
                        />
                    </div>
                    {listType === 'templates' && (
                        <Link
                            href='/templates/create'
                            className='px-3 py-2 rounded transition-colors hover:bg-login-600
                                self-end md:self-auto inline-flex items-center gap-2'
                        >
                            <Plus className='inline-block size-4' />
                        </Link>
                    )}
                </div>

                {templateData && templateData.length > 0 ? (
                    <div className='flex-1 flex flex-col justify-between min-h-0'>
                        <FormsTable
                            data={templateData}
                            resourceType='template'
                        />

                        <Pagination
                            pageSize={limit}
                            totalRows={totalItems}
                        />
                    </div>
                ) : (
                    <div className='flex-1 flex flex-col items-center justify-center min-h-0'>
                        <p className='text-gray-500 text-center'>No templates found</p>
                    </div>
                )}
            </div>
        </PageContainer>
    )
}
