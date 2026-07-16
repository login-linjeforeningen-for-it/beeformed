import { getSubmission, getUserSubmissions, getPublicForm } from '@utils/api/server'
import { notFound } from 'next/navigation'
import { Alert, PageContainer, SearchInput } from 'uibee/components'
import FormRenderer from '@components/form/renderer'
import SubmissionsTable from '@components/tables/submissions'

const UUID_V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default async function Page(
    { params, searchParams }: { params: Promise<{ id?: string[] }>; searchParams: Promise<{ [key: string]: string | undefined }> }
) {
    const { id } = await params
    const submissionId = Array.isArray(id) ? id[0] : id
    if (submissionId !== undefined && !UUID_V7.test(submissionId)) notFound()
    const filters = await searchParams

    const orderBy = typeof filters.column === 'string' ? filters.column : 'submitted_at'
    const order = typeof filters.order === 'string' && (filters.order === 'asc' || filters.order === 'desc') ? filters.order : 'desc'
    let data
    try {
        data = submissionId ? await getSubmission(submissionId) : await getUserSubmissions({
            search: typeof filters.q === 'string' ? filters.q : '',
            offset: typeof filters.page === 'string' ? (Number(filters.page) - 1) * 14 : undefined,
            limit: 14,
            orderBy,
            sort: order
        })
    } catch {
        notFound()
    }

    if (submissionId) {
        const submission = data as Submission
        let formData
        try {
            formData = await getPublicForm(submission.form_id.toString())
        } catch {
            notFound()
        }

        const form = { ...formData, id: submission.form_id.toString() }

        return (
            <PageContainer title='Submission Details'>
                <div className='flex flex-col gap-4'>
                    {submission.status === 'registered' && (
                        <Alert variant='info'>You are registered for this form.</Alert>
                    )}
                    {submission.status === 'waitlisted' && (
                        <Alert variant='warning'>
                            You are on the waitlist, this form is currently full.
                            {submission.waitlist_position != null && (
                                <span className='ml-2 font-medium'>Position nr: {submission.waitlist_position}</span>
                            )}
                        </Alert>
                    )}
                    {submission.status === 'rejected' && (
                        <Alert variant='warning'>Your submission has been rejected.</Alert>
                    )}
                    {submission.status === 'cancelled' && (
                        <Alert variant='info'>Your submission has been cancelled.</Alert>
                    )}
                    {form.description &&
                        <div className='highlighted-section'>
                            <p>{form.description}</p>
                        </div>
                    }
                    <FormRenderer form={form} submission={submission} />
                </div>
            </PageContainer>
        )
    } else {
        const submissions = data as GetSubmissionsProps

        return (
            <PageContainer title='My Submissions'>
                <div className='flex h-full flex-col pb-4'>
                    <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
                        <div className='mb-4 flex justify-between' style={{ viewTransitionName: 'list-controls' }}>
                            <SearchInput
                                placeholder='Search submissions...'
                                variant='minimal'
                            />
                        </div>
                        <div className='flex min-h-0 flex-1 flex-col'>
                            <SubmissionsTable
                                data={submissions.data}
                                totalRows={submissions.total}
                            />
                        </div>
                    </div>
                </div>
            </PageContainer>
        )
    }
}
