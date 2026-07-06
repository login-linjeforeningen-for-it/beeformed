import { getForms, getSharedForms } from '@utils/api/server'
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

    const totalItems = forms.total

    return (
        <PageContainer title='Forms'>
            <div className='mb-4'>
                <ViewToggle
                    current={type}
                    left={{ value: 'forms', text: 'My Forms', path: '/forms' }}
                    right={{ value: 'shared', text: 'Shared Forms', path: '/forms/shared' }}
                />
            </div>
            <div className='flex h-full flex-col pt-6 pb-4'>
                <div
                    className='mb-4 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between'
                    style={{ viewTransitionName: 'list-controls' }}
                >
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

                <div className='flex min-h-0 flex-1 flex-col'>
                    <FormsTable
                        data={forms.data}
                        totalRows={totalItems}
                    />
                </div>
            </div>
            { type === 'forms' && <FAB href='/forms/create' label='Create Form' /> }
        </PageContainer>
    )
}
