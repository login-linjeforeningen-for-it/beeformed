import { PageContainer } from 'uibee/components'
import FormPage from '@components/form/pages/form'
import { cookies } from 'next/headers'
import { forbidden } from 'next/navigation'

export default async function CreateFormPage() {
    const groups = (await cookies()).get('user_groups')?.value.split(',') || []
    if (!groups.map((g: string) => g.toLowerCase()).includes('aktiv')) {
        return forbidden()
    }

    return (
        <PageContainer title='Create New Form'>
            <div className='w-full max-w-2xl'>
                <FormPage />
            </div>
        </PageContainer>
    )
}
