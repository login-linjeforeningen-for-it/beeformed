'use client'

import apiRequestClient from './request'
import { buildFilterQuery } from './query'
import { FilterProps } from '../types'

export async function postSubmission(formId: string, data: PostSubmissionProps) {
    return apiRequestClient({ method: 'POST', path: `forms/${formId}/submissions`, data })
}

export async function searchSubmissions(formId: string, search: string, limit = 10): Promise<GetSubmissionsProps> {
    const queryParts = new URLSearchParams()
    queryParts.append('search', search)
    queryParts.append('limit', String(limit))

    return apiRequestClient({ method: 'GET', path: `forms/${formId}/submissions?${queryParts.toString()}` })
}

export async function getSubmissions(formId: string, filter: FilterProps = {}): Promise<GetSubmissionsProps> {
    const query = buildFilterQuery(filter)
    return apiRequestClient({ method: 'GET', path: `forms/${formId}/submissions?${query}` })
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

    return apiRequestClient({
        method: 'POST',
        path: `submissions/${normalizedSubmissionId}/scan`,
        data: { form_id: normalizedFormId }
    })
}

export async function cancelSubmission(submissionId: string) {
    return apiRequestClient({ method: 'DELETE', path: `submissions/${submissionId}` })
}
