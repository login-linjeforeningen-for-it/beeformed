import { PageContainer } from '@components/container/page'
import { getSubmission, getUserSubmissions, getPublicForm } from '@utils/api'
import { notFound } from 'next/navigation'
import SearchInput from '@components/search/search'
import { Pagination } from 'uibee/components'
import FormRenderer from '@components/form/renderer'
import SubmissionsTable from '../../../components/tables/submissions'
import { formatDateTime } from '@utils/dateTime'

export default async function Page(
    { params, searchParams }: { params: Promise<{ id?: string[] }>; searchParams: Promise<{ [key: string]: string | undefined }> }
) {
    const { id } = await params
    const filters = await searchParams

    const orderBy = typeof filters.column === 'string' ? filters.column : 'submitted_at'
    const order = typeof filters.order === 'string' && (filters.order === 'asc' || filters.order === 'desc') ? filters.order : 'desc'
    let data
    try {
        data = id ? await getSubmission(Array.isArray(id) ? id[0] : id) : await getUserSubmissions({
            search: typeof filters.q === 'string' ? filters.q : '',
            offset: typeof filters.page === 'string' ? (Number(filters.page) - 1) * 14 : undefined,
            limit: 14,
            orderBy,
            sort: order
        })
    } catch {
        notFound()
    }

    if (id) {
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
                    {submission.status === 'waitlisted' && (
                        <div className='bg-orange-500/10 border border-orange-500 text-orange-500 rounded p-4'>
                            <strong>Status: Waitlisted</strong><br/>
                            This form is full. You are currently on the waitlist.
                        </div>
                    )}
                    {submission.status === 'registered' && (
                        <div className='bg-green-500/10 border border-green-500 text-green-500 rounded p-4'>
                            <strong>Status: Registered</strong><br/>
                            Your submission has been registered.
                        </div>
                    )}
                    {submission.status === 'rejected' && (
                        <div className='bg-red-500/10 border border-red-500 text-red-500 rounded p-4'>
                            <strong>Status: Rejected</strong><br/>
                            Your submission has been rejected.
                        </div>
                    )}
                    {submission.status === 'cancelled' && (
                        <div className='bg-gray-500/10 border border-gray-500 text-gray-500 rounded p-4'>
                            <strong>Status: Cancelled</strong><br/>
                            Your submission has been cancelled.
                        </div>
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
        const submissionsData = submissions.data.map(submission => ({
            ...submission,
            submitted_at: formatDateTime(submission.submitted_at),
        }))
        const totalItems = submissions.total

        return (
            <PageContainer title='My Submissions'>
                <div className='pt-20 pb-4 flex flex-col h-full'>
                    <div className='flex flex-1 flex-col min-h-0 overflow-hidden'>
                        <div className='flex justify-between mb-4'>
                            <SearchInput placeholder='Search submissions...' />
                        </div>
                        <div className='flex-1 overflow-auto'>
                            {submissionsData.length === 0 ? (
                                <div className='flex items-center justify-center h-full'>
                                    <p>No submissions yet.</p>
                                </div>
                            ) : (
                                <SubmissionsTable
                                    data={submissionsData}
                                />
                            )}
                        </div>
                        <div className='mt-4'>
                            <Pagination pageSize={14} totalRows={totalItems} />
                        </div>
                    </div>
                </div>
            </PageContainer>
        )
    }
}
