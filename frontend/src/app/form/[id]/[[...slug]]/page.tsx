import { Button, PageContainer } from 'uibee/components'
import EditFormPage from '@components/form/pages/form'
import EditFieldsPage from '@components/form/pages/fields'
import { getFields, getForm, getPermissions, getSubmissions } from '@utils/api/server'
import { notFound } from 'next/navigation'
import { ScanQrCode } from 'lucide-react'
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

    let data
    let formData

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
        notFound()
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
        <PageContainer title={`Form - ${(type.charAt(0).toUpperCase() + type.slice(1)).replace('-', ' ')}`}>
            <div className='mb-4 flex flex-col gap-2 pb-2 sm:flex-row' style={{ viewTransitionName: 'page-tabs' }}>
                <div className='flex flex-wrap gap-2 sm:flex-row'>
                    <Button
                        text='Fields'
                        path={`/form/${id}/fields`}
                        variant={type === 'fields' ? 'primary' : 'secondary'}
                    />
                    <Button
                        text='Settings'
                        path={`/form/${id}/settings`}
                        variant={type === 'settings' ? 'primary' : 'secondary'}
                    />
                    <Button
                        text='Permissions'
                        path={`/form/${id}/permissions`}
                        variant={type === 'permissions' ? 'primary' : 'secondary'}
                    />
                    <Button
                        text='Submissions'
                        path={`/form/${id}/submissions`}
                        variant={type === 'submissions' || type === 'all-submissions' ? 'primary' : 'secondary'}
                    />
                    <Button
                        text='QR Scanner'
                        path={`/qr/${id}`}
                        icon={<ScanQrCode size={14} />}
                        variant={type === 'qr' ? 'primary' : 'secondary'}
                    />
                    {formData && <ShareButton slug={formData.slug} />}
                </div>
            </div>
            <div className='flex h-full flex-col pt-6 pb-4'>
                <div className='flex h-full min-w-0 justify-between'>
                    {renderContent(data)}
                </div>
            </div>
        </PageContainer>
    )
}

