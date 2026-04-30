import { getPublicForm } from '@utils/api/server'
import FormRenderer from '@components/form/renderer'
import { Alert, MarkdownRender, PageContainer } from 'uibee/components'

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params

    try {
        const form = await getPublicForm(slug)

        return (
            <PageContainer title={form.title}>
                {form.description &&
                    <div className='highlighted-section'>
                        <MarkdownRender MDstr={form.description} />
                    </div>
                }
                <FormRenderer form={{ ...form, id: form.id.toString() }} />
            </PageContainer>
        )
    } catch {
        return (
            <PageContainer title='Form Not Found'>
                <div className='w-full h-full flex items-center justify-center'>
                    <Alert variant='warning'>
                        <p>
                            The form you are looking for does not exist or is not published.
                        </p>
                    </Alert>
                </div>
            </PageContainer>
        )
    }
}
