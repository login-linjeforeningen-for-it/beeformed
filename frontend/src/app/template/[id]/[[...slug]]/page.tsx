import { Button, PageContainer } from 'uibee/components'
import { getTemplate, getTemplateFields, getTemplatePermissions } from '@utils/api/server'
import { notFound } from 'next/navigation'
import EditTemplateFieldsPage from '@components/template/pages/fields'
import EditTemplatePermissionsPage from '@components/template/pages/permissions'
import EditTemplatePage from '@components/template/pages/form'

type PageProps = {
    params: Promise<{ id: string, slug?: string[] | string }>
}

const UUID_V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default async function Page({ params }: PageProps) {
    const { id, slug } = await params
    if (!UUID_V7.test(id)) notFound()
    const rawType = Array.isArray(slug) ? slug[0] : slug
    const type = rawType || 'fields'

    let data

    try {
        switch (type) {
            case 'settings':
                data = await getTemplate(id)
                break
            case 'permissions':
                data = await getTemplatePermissions(id)
                break
            default:
                data = await getTemplateFields(id)
        }
    } catch {
        notFound()
    }

    function renderContent(content: unknown) {
        switch (type) {
            case 'settings':
                return <EditTemplatePage template={content as GetTemplateProps} />
            case 'permissions':
                return <EditTemplatePermissionsPage permissions={content as GetTemplatePermissionsProps} templateId={id} />
            default:
                return <EditTemplateFieldsPage fields={content as GetFieldsProps} templateId={id} />
        }
    }

    return (
        <PageContainer title={`Template - ${(type.charAt(0).toUpperCase() + type.slice(1)).replace('-', ' ')}`}>
            <div className='mb-4 flex flex-wrap gap-2' style={{ viewTransitionName: 'page-tabs' }}>
                <Button
                    text='Fields'
                    path={`/template/${id}/fields`}
                    variant={type === 'fields' ? 'primary' : 'secondary'}
                />
                <Button
                    text='Settings'
                    path={`/template/${id}/settings`}
                    variant={type === 'settings' ? 'primary' : 'secondary'}
                />
                <Button
                    text='Permissions'
                    path={`/template/${id}/permissions`}
                    variant={type === 'permissions' ? 'primary' : 'secondary'}
                />
            </div>
            <div className='flex h-full flex-col pt-6 pb-4'>
                <div className='flex h-full min-w-0 justify-between'>
                    {renderContent(data)}
                </div>
            </div>
        </PageContainer>
    )
}

