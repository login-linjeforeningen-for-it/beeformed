import { PageContainer } from 'uibee/components'
import EditFormPage from '@components/form/pages/form'
import EditFieldsPage from '@components/form/pages/fields'
import { getFields, getForm, getPermissions, getSubmissions } from '@utils/api/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import EditPermissionsPage from '@components/form/pages/permissions'
import SubmissionsPage from '@components/form/pages/submissions'
import AllSubmissionsPage from '@components/form/pages/all-submissions'
import ShareButton from '@components/button/share-button'

type PageProps = {
    params: Promise<{ id: string, slug?: string[] | string }>
    searchParams: Promise<{ [key: string]: string | undefined }>
}

export default async function Page({ params, searchParams }: PageProps) {
    const { id, slug } = await params
    const filters = await searchParams
    const type = Array.isArray(slug) ? slug[0] : slug || 'fields'
    const validTypes = new Set(['fields', 'settings', 'permissions', 'submissions', 'all-submissions'])
    if (!validTypes.has(type)) {
        notFound()
    }

    const orderBy = typeof filters.column === 'string' ? filters.column : 'submitted_at'
    const sort = (typeof filters.order === 'string' && (filters.order === 'asc' || filters.order === 'desc')) ? filters.order : 'desc'

    const filter = {
        search: typeof filters.q === 'string' ? filters.q : '',
        offset: type === 'all-submissions' ? undefined : (typeof filters.page === 'string' ? (Number(filters.page) - 1) * 14 : 0),
        limit: type === 'all-submissions' ? undefined : 14,
        includeAnswers: type === 'all-submissions',
        orderBy,
        sort: sort as 'asc' | 'desc'
    }

    let data: unknown = null
    let formData: GetFormProps | null = null
    let loadError = false

    try {
        switch (type) {
            case 'settings':
                data = await getForm(id)
                break
            case 'permissions':
                data = await getPermissions(id)
                break
            case 'submissions': {
                const submissionsFilter = {
                    ...filter,
                    includeAnswers: false
                }
                data = await getSubmissions(id, submissionsFilter)
                break
            }
            case 'all-submissions': {
                const allSubmissionsFilter = {
                    ...filter,
                    includeAnswers: true
                }
                data = await getSubmissions(id, allSubmissionsFilter)
                break
            }
            default:
                data = await getFields(id)
        }

        formData = await getForm(id)
    } catch {
        loadError = true
    }

    function renderContent(data: unknown) {
        switch (type) {
            case 'settings':
                return <EditFormPage
                    form={data as GetFormProps}
                />
            case 'permissions':
                return <EditPermissionsPage
                    permissions={data as GetPermissionsProps}
                    formId={id}
                />
            case 'submissions':
                return <SubmissionsPage
                    submissions={data as GetSubmissionsProps}
                    currentOrderBy={filter.orderBy}
                    currentSort={filter.sort}
                    formId={id}
                />
            case 'all-submissions':
                return <AllSubmissionsPage
                    submissions={data as GetSubmissionsProps}
                    currentOrderBy={filter.orderBy}
                    currentSort={filter.sort}
                />
            default:
                return <EditFieldsPage
                    fields={data as GetFieldsProps}
                    formId={id}
                />
        }
    }

    return (
        <PageContainer title={`Editing Form - ${(type.charAt(0).toUpperCase() + type.slice(1)).replace('-', ' ')}`}>
            <div className='flex flex-wrap gap-2 mb-4'>
                <LinkButton
                    href={`/form/${id}/fields`}
                    highlight={type === 'fields'}
                >
                    Fields
                </LinkButton>
                <LinkButton
                    href={`/form/${id}/settings`}
                    highlight={type === 'settings'}
                >
                    Settings
                </LinkButton>
                <LinkButton
                    href={`/form/${id}/permissions`}
                    highlight={type === 'permissions'}
                >
                    Permissions
                </LinkButton>
                <LinkButton
                    href={`/form/${id}/submissions`}
                    highlight={type === 'submissions' || type === 'all-submissions'}
                >
                    Submissions
                </LinkButton>
                <LinkButton
                    href={`/qr/${id}`}
                    highlight={type === 'qr'}
                >
                    QR Scanner
                </LinkButton>
                {formData && <ShareButton slug={formData.slug} />}
            </div>
            <div className='pt-6 pb-4 flex flex-col h-full'>
                <div className='flex justify-between h-full min-w-0'>
                    {loadError || !formData ? (
                        <div className='w-full rounded border border-yellow-600/50 bg-yellow-600/10 p-4 text-sm text-yellow-200'>
                            Unable to load this form right now. Please try again in a moment.
                        </div>
                    ) : (
                        renderContent(data)
                    )}
                </div>
            </div>
        </PageContainer>
    )
}

function LinkButton({ href, highlight, children }: { href: string, highlight: boolean, children: React.ReactNode }) {
    return (
        <Link
            href={href}
            className={`px-3 sm:px-4 py-2 rounded transition-colors text-sm sm:text-base ${highlight ?
                'bg-login text-white' :
                'bg-login-700 text-login-100 hover:bg-login-600'
            }`}
        >
            {children}
        </Link>
    )
}
