import { PageContainer } from 'uibee/components'
import { getTemplate, getTemplateFields, getTemplatePermissions } from '@utils/api'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import EditTemplateFieldsPage from '@components/template/pages/fields'
import EditTemplatePermissionsPage from '@components/template/pages/permissions'

type PageProps = {
    params: Promise<{ id: string, slug: string }>
}

export default async function Page({ params }: PageProps) {
    const { id, slug } = await params
    const type = slug === 'settings' ? 'fields' : slug

    let data
    let templateData

    try {
        switch (type) {
            case 'permissions':
                data = await getTemplatePermissions(id)
                break
            default:
                data = await getTemplateFields(id)
        }

        templateData = await getTemplate(id)
    } catch {
        notFound()
    }

    function renderContent(content: unknown) {
        switch (type) {
            case 'permissions':
                return <EditTemplatePermissionsPage permissions={content as GetTemplatePermissionsProps} templateId={id} />
            default:
                return <EditTemplateFieldsPage fields={content as GetFieldsProps} templateId={id} />
        }
    }

    return (
        <PageContainer title={`Editing Template - ${(type.charAt(0).toUpperCase() + type.slice(1)).replace('-', ' ')}`}>
            <div className='flex flex-wrap gap-2 mb-4'>
                <LinkButton
                    href={`/templates/${id}/fields`}
                    highlight={type === 'fields'}
                >
                    Fields
                </LinkButton>
                <LinkButton
                    href={`/templates/${id}/permissions`}
                    highlight={type === 'permissions'}
                >
                    Permissions
                </LinkButton>
            </div>
            <div className='pt-6 pb-4 flex flex-col h-full'>
                <div className='flex justify-between h-full min-w-0'>
                    {renderContent(data)}
                </div>
            </div>
            <p className='text-sm text-login-200 mt-4'>Template: {templateData.title}</p>
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
