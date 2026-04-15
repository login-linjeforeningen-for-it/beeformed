import { PageContainer } from 'uibee/components'
import { cookies } from 'next/headers'
import { forbidden } from 'next/navigation'
import CreateTemplateButton from '@components/template/pages/create'

export default async function CreateTemplatePage() {
    const groups = (await cookies()).get('user_groups')?.value.split(',') || []
    if (!groups.map((g: string) => g.toLowerCase()).includes('queenbee')) {
        return forbidden()
    }

    return (
        <PageContainer title='Create New Template'>
            <div className='w-full max-w-2xl'>
                <CreateTemplateButton />
            </div>
        </PageContainer>
    )
}
