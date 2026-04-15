'use server'

import { putForm } from '@utils/api'
import {
    getRequiredString,
    getOptionalString,
    getOptionalNumber,
    getBoolean,
    getRequiredDateTime
} from '@utils/validate'

type FormState =
    | null
    | string

type PutFormState = FormState | PutFormProps



function extractFormProps(formData: FormData): PutFormProps {
    return {
        slug:                   getRequiredString(formData, 'slug'),
        title:                  getRequiredString(formData, 'title'),
        description:            getOptionalString(formData, 'description'),
        anonymous_submissions:  getBoolean(formData, 'anonymous_submissions'),
        limit:                  getOptionalNumber(formData, 'limit'),
        waitlist:               getBoolean(formData, 'waitlist'),
        multiple_submissions:   getBoolean(formData, 'multiple_submissions'),
        published_at:           getRequiredDateTime(formData, 'published_at'),
        expires_at:             getRequiredDateTime(formData, 'expires_at')
    }
}

export async function updateForm(_: PutFormState, formData: FormData): Promise<PutFormState> {
    try {
        const props = extractFormProps(formData)

        const id = getRequiredString(formData, 'id')

        await putForm(id, props)
        return null
    } catch (error) {
        return error instanceof Error ? error.message : 'Unknown error'
    }
}
