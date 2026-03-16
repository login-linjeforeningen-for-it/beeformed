import { PageContainer } from '@components/container/page'
import { getForms, getSharedForms } from '@utils/api'
import { Pagination } from 'uibee/components'
import SearchInput from '@components/inputs/search'
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

    const slugs = param.slug
    const type = slugs && (Array.isArray(slugs) ? slugs[0] : slugs) || 'forms'

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

    let forms
    try {
        forms = type === 'shared' ? await getSharedForms(filter) : await getForms(filter)
    } catch {
        notFound()
    }

    const formsData = forms.data.map(form => ({
        ...form,
        created_at: formatDateTime(form.created_at)
    }))
    const totalItems = forms.total

    return (
        <PageContainer title='Forms'>
            <div className='flex space-x-4 mb-4'>
                <Link
                    href='/forms'
                    className={`px-4 py-2 rounded transition-colors ${
                        type === 'forms'
                            ? 'bg-login text-white'
                            : 'bg-login-700 text-login-100 hover:bg-login-600'
                    }`}
                >
                    My Forms
                </Link>
                <Link
                    href='/forms/shared'
                    className={`px-4 py-2 rounded transition-colors ${
                        type === 'shared'
                            ? 'bg-login text-white'
                            : 'bg-login-700 text-login-100 hover:bg-login-600'
                    }`}
                >
                    Shared Forms
                </Link>
            </div>
            <div className='pt-6 pb-4 flex flex-col h-full'>
                <div className='flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 mb-4'>
                    <div className='w-full md:w-auto'>
                        <SearchInput placeholder='Search forms...' />
                    </div>
                    { type === 'forms' &&
                        <Link
                            href='/forms/create'
                            className='p-2 rounded transition-colors hover:bg-login-600'
                        >
                            <Plus className='inline-block size-6' />
                        </Link> }
                </div>

                {formsData && formsData.length > 0 ? (
                    <div className='flex-1 flex flex-col justify-between min-h-0'>
                        <FormsTable
                            data={formsData}
                        />

                        <Pagination
                            pageSize={limit}
                            totalRows={totalItems}
                        />
                    </div>
                ) : (
                    <div className='flex-1 flex flex-col items-center justify-center min-h-0'>
                        <p className='text-gray-500 text-center'>No forms found</p>
                    </div>
                )}
            </div>
        </PageContainer>
    )
}
