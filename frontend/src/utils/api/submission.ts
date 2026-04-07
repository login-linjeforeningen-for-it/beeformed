'use server'

import apiRequest from './apiWrapper'
import { FilterProps } from './types'

export async function getSubmissions(
    formId: string,
    { search, offset, limit, orderBy, sort, includeAnswers }: FilterProps = {}
): Promise<GetSubmissionsProps> {
    const queryParts = new URLSearchParams()
    if (search) queryParts.append('search', String(search))
    if (limit) queryParts.append('limit', String(limit))
    if (offset) queryParts.append('offset', String(offset))
    if (orderBy) queryParts.append('order_by', String(orderBy))
    if (sort) queryParts.append('sort', String(sort))
    if (includeAnswers) queryParts.append('include_answers', 'true')

    return apiRequest({ method: 'GET', path: `forms/${formId}/submissions?${queryParts.toString()}` })
}

export async function searchSubmissions(formId: string, search: string, limit = 10): Promise<GetSubmissionsProps> {
    const queryParts = new URLSearchParams()
    queryParts.append('search', search)
    queryParts.append('limit', String(limit))
    return apiRequest({ method: 'GET', path: `forms/${formId}/submissions?${queryParts.toString()}` })
}

export async function postSubmission(formId: string, data: PostSubmissionProps) {
    return apiRequest({ method: 'POST', path: `forms/${formId}/submissions`, data })
}

export async function getSubmission(submissionId: string, formId?: string): Promise<Submission> {
    const path = formId ? `submissions/${submissionId}?formId=${formId}` : `submissions/${submissionId}`
    return apiRequest({ method: 'GET', path })
}

export async function scanSubmission(submissionId: string, formId: string): Promise<Submission> {
    const normalizedSubmissionId = submissionId.trim()
    const normalizedFormId = formId.trim()

    if (!normalizedSubmissionId) {
        throw new Error('Missing submission ID')
    }

    if (!normalizedFormId) {
        throw new Error('Missing form ID')
    }

    return apiRequest({
        method: 'POST',
        path: `submissions/${normalizedSubmissionId}/scan`,
        data: { form_id: normalizedFormId }
    })
}

export async function cancelSubmission(submissionId: string) {
    return apiRequest({ method: 'DELETE', path: `submissions/${submissionId}` })
}

export async function getUserSubmissions(
    { search, offset, limit, orderBy, sort }: FilterProps = {}
): Promise<GetSubmissionsProps> {
    const queryParts = new URLSearchParams()
    if (search) queryParts.append('search', String(search))
    if (limit) queryParts.append('limit', String(limit))
    if (offset) queryParts.append('offset', String(offset))
    if (orderBy) queryParts.append('order_by', String(orderBy))
    if (sort) queryParts.append('sort', String(sort))

    return apiRequest({ method: 'GET', path: `submissions?${queryParts.toString()}` })
}
