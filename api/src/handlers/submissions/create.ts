import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import type { CreateSubmissionBody } from '#/schemas.ts'
import config from '#constants'
import { runInTransaction } from '#db'
import { loadSQL } from '#utils/sql.ts'
import { sendTypedEmail } from '#utils/email/sendSMTP.ts'
import { logError } from '#utils/logger.ts'

function isRequiredSwitchValue(value: unknown): boolean {
    if (typeof value === 'boolean') return value
    if (typeof value === 'number') return value === 1
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase()
        return ['true', '1', 'yes', 'on'].includes(normalized)
    }
    return false
}

function hasRequiredFieldValue(field: { field_type: string; options: string[] | null }, value: unknown): boolean {
    if (field.field_type === 'checkbox' && (!Array.isArray(field.options) || field.options.length === 0)) {
        return isRequiredSwitchValue(value)
    }

    if (Array.isArray(value)) {
        return value.some(item => String(item).trim().length > 0)
    }

    if (value === null || value === undefined) return false
    return String(value).trim().length > 0
}

function serializeFieldValue(value: unknown): string | null {
    if (value === null || value === undefined) return null
    if (Array.isArray(value)) return JSON.stringify(value)
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
}

export default async function createSubmission(
    req: AuthenticatedRequest<{ Params: IdParams; Body: CreateSubmissionBody }>,
    res: FastifyReply
) {
    const body = req.body
    const formId = req.params.id

    try {
        const result = await runInTransaction(async (client) => {
            const formQuery = await loadSQL('forms/selectByIdForUpdate.sql')
            const formResult = await client.query(formQuery, [formId])

            if (formResult.rows.length === 0) {
                throw Object.assign(new Error('Form not found'), { statusCode: 404 })
            }
            const form = formResult.rows[0]

            const now = new Date()
            if (new Date(form.published_at) > now) {
                throw Object.assign(new Error('Form has not opened yet'), { statusCode: 400 })
            }
            if (new Date(form.expires_at) <= now) {
                throw Object.assign(new Error('Form has closed'), { statusCode: 400 })
            }

            const submissionFields = body.fields

            const userId = form.anonymous_submissions ? null : req.user.id
            let status: 'registered' | 'waitlisted' = 'registered'

            if (!form.anonymous_submissions && !form.multiple_submissions && userId) {
                const checkSubmissionSql = await loadSQL('submissions/checkUserSubmission.sql')
                const existingSubmission = await client.query(checkSubmissionSql, [formId, userId])
                if (existingSubmission.rows[0].count > 0) {
                    throw Object.assign(new Error('You have already submitted to this form'), { statusCode: 409 })
                }
            }

            if (form.limit) {
                const currentCount = parseInt(form.registered_count) || 0
                if (currentCount >= form.limit) {
                    if (form.waitlist) {
                        status = 'waitlisted'
                    } else {
                        throw Object.assign(new Error('Form is full'), { statusCode: 400 })
                    }
                }
            }

            const submissionSql = await loadSQL('submissions/insert.sql')
            const submissionResult = await client.query(submissionSql, [formId, userId, status])
            const submissionId = submissionResult.rows[0].id

            type FormFieldRow = { id: string; title: string; required: boolean; field_type: string; options: string[] | null }
            const fieldsFromForm: FormFieldRow[] = Array.isArray(form.fields) ? form.fields : []
            const formFieldById = new Map<string, FormFieldRow>()
            for (const field of fieldsFromForm) {
                formFieldById.set(field.id, field)
            }

            const valuesByFieldId = new Map<string, unknown>()
            for (const fieldInput of submissionFields) {
                const fieldId = fieldInput.field_id.trim()
                if (!fieldId) {
                    throw Object.assign(new Error('field_id must be a non-empty string'), { statusCode: 400 })
                }

                const formField = formFieldById.get(fieldId)
                if (!formField) {
                    throw Object.assign(new Error(`Field ${fieldId} does not belong to this form`), { statusCode: 400 })
                }

                valuesByFieldId.set(fieldId, fieldInput.value)
            }

            const missingRequiredTitles = fieldsFromForm
                .filter(field => field.required)
                .filter(field => !hasRequiredFieldValue(field, valuesByFieldId.get(field.id)))
                .map(field => field.title)

            if (missingRequiredTitles.length > 0) {
                throw Object.assign(new Error(`Missing required fields: ${missingRequiredTitles.join(', ')}`), { statusCode: 400 })
            }

            const dataSql = await loadSQL('submissions/insertData.sql')
            for (const [fieldId, value] of valuesByFieldId.entries()) {
                await client.query(dataSql, [submissionId, fieldId, serializeFieldValue(value)])
            }

            return { submissionId, form, status }
        })

        const { submissionId, form, status } = result

        try {
            if (req.user.email) {
                await sendTypedEmail('submission', req.user.email, {
                    title: form.title,
                    status,
                    ownerEmail: form.creator_email,
                    actionUrl: `${config.FRONTEND_URL}/submissions/${submissionId}`,
                    actionText: 'View Submission',
                    submissionId

                })
            }
        } catch (emailError) {
            logError('Error sending confirmation email', {
                event: 'submission.confirmation_email_failed',
                submissionId,
                formId,
                userId: req.user.id,
                requestId: req.id,
                error: emailError
            })
        }

        return res.status(201).send({ id: submissionId })
    } catch (error: unknown) {
        const err = error as Error & { statusCode?: number }
        if (err.statusCode) {
            return res.status(err.statusCode).send({ error: err.message })
        }
        logError('Error creating submission', {
            event: 'http.internal_error',
            requestId: req.id,
            error
        })
        return res.status(500).send({ error: 'Internal server error' })
    }
}
