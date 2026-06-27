import { getForms, getSharedForms } from '@utils/api/server'
import { Pagination, PageContainer, SearchInput } from 'uibee/components'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatDateTime } from '@utils/dateTime'
import { Plus } from 'lucide-react'
import FormsTable from '@components/tables/forms'
import FAB from '@components/button/fab'

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
    const orderBy = typeof filters.column === 'string' ? filters.column : 'updated_at'
    const sort: 'asc' | 'desc' = typeof filters.order === 'string' && (filters.order === 'asc' || filters.order === 'desc')
        ? filters.order
        : 'desc'

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
            <div className='mb-4 flex flex-wrap gap-2 sm:gap-4'>
                <Link
                    href='/forms'
                    className={`flex min-h-11 items-center rounded px-4 py-3 text-sm transition-colors sm:text-base ${
                        type === 'forms'
                            ? 'bg-login text-white'
                            : 'bg-login-700 text-login-100 hover:bg-login-600'
                    }`}
                >
                    My Forms
                </Link>
                <Link
                    href='/forms/shared'
                    className={`flex min-h-11 items-center rounded px-4 py-3 text-sm transition-colors sm:text-base ${
                        type === 'shared'
                            ? 'bg-login text-white'
                            : 'bg-login-700 text-login-100 hover:bg-login-600'
                    }`}
                >
                    Shared Forms
                </Link>
            </div>
            <div className='flex h-full flex-col pt-6 pb-4'>
                <div className='mb-4 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between'>
                    <div className='w-full md:w-auto'>
                        <SearchInput
                            placeholder='Search forms...'
                            variant='minimal'
                        />
                    </div>
                    { type === 'forms' &&
                        <Link
                            href='/forms/create'
                            aria-label='Create form'
                            className='hidden items-center rounded p-2 transition-colors hover:bg-login-600 md:flex'
                        >
                            <Plus className='inline-block size-6' />
                        </Link> }
                </div>

                {formsData && formsData.length > 0 ? (
                    <div className='flex min-h-0 flex-1 flex-col justify-between'>
                        <FormsTable
                            data={formsData}
                        />

                        <Pagination
                            pageSize={limit}
                            totalRows={totalItems}
                        />
                    </div>
                ) : (
                    <div className='flex min-h-0 flex-1 flex-col items-center justify-center'>
                        <p className='text-center text-gray-500'>No forms found</p>
                    </div>
                )}
            </div>
            { type === 'forms' && <FAB href='/forms/create' label='Create Form' /> }
        </PageContainer>
    )
}
