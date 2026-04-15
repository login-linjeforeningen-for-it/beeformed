import type { FastifyReply, FastifyRequest } from 'fastify'
import { runInTransaction } from '#db'
import { loadSQL } from '#utils/sql.ts'
import { sendTemplatedMail } from '#utils/email/sendSMTP.ts'
import { sendInternalServerError } from '#utils/http/errors.ts'

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
    if (Array.isArray(value)) return value.map(item => String(item)).join(',')
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
}

export default async function createSubmission(req: FastifyRequest, res: FastifyReply) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = req.body as any
    const { id: formId } = req.params as { id: string }

    try {
        const result = await runInTransaction(async (client) => {
            await client.query('SELECT 1 FROM forms WHERE id = $1 FOR UPDATE', [formId])

            const formQuery = await loadSQL('forms/get.sql')
            const formResult = await client.query(formQuery, [formId])
            
            if (formResult.rows.length === 0) {
                const error = new Error('Form not found');
                (error as any).statusCode = 404
                throw error
            }
            const form = formResult.rows[0]
            const submissionFields = Array.isArray(body?.fields) ? body.fields : null

            if (!submissionFields) {
                const error = new Error('fields must be an array')
                ;(error as any).statusCode = 400
                throw error
            }

            if (!form.anonymous_submissions && !req.user?.id) {
                const error = new Error('Authentication required');
                (error as any).statusCode = 401
                throw error
            }

            const userId = form.anonymous_submissions ? null : req.user!.id
            let status = 'registered'
            
            if (!form.anonymous_submissions && !form.multiple_submissions && userId) {
                const checkSubmissionSql = await loadSQL('submissions/checkUserSubmission.sql')
                const existingSubmission = await client.query(checkSubmissionSql, [formId, userId])
                if (parseInt(existingSubmission.rows[0].count) > 0) {
                    throw new Error('You have already submitted to this form')
                }
            }
            
            if (form.limit) {
                const currentCount = parseInt(form.registered_count) || 0
                if (currentCount >= form.limit) {
                    if (form.waitlist) {
                        status = 'waitlisted'
                    } else {
                        const error = new Error('Form is full');
                        (error as any).statusCode = 400
                        throw error
                    }
                }
            }

            const submissionSql = await loadSQL('submissions/post.sql')
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
                if (!fieldInput || typeof fieldInput !== 'object') {
                    const error = new Error('Each submitted field must be an object')
                    ;(error as any).statusCode = 400
                    throw error
                }

                const fieldIdRaw = (fieldInput as { field_id?: unknown }).field_id
                const fieldId = typeof fieldIdRaw === 'string' ? fieldIdRaw.trim() : ''
                if (!fieldId) {
                    const error = new Error('field_id must be a non-empty string')
                    ;(error as any).statusCode = 400
                    throw error
                }

                const formField = formFieldById.get(fieldId)
                if (!formField) {
                    const error = new Error(`Field ${fieldId} does not belong to this form`)
                    ;(error as any).statusCode = 400
                    throw error
                }

                valuesByFieldId.set(fieldId, (fieldInput as { value?: unknown }).value)
            }

            const missingRequiredTitles = fieldsFromForm
                .filter(field => field.required)
                .filter(field => !hasRequiredFieldValue(field, valuesByFieldId.get(field.id)))
                .map(field => field.title)

            if (missingRequiredTitles.length > 0) {
                const error = new Error(`Missing required fields: ${missingRequiredTitles.join(', ')}`)
                ;(error as any).statusCode = 400
                throw error
            }

            const dataSql = await loadSQL('submissions/postData.sql')
            for (const [fieldId, value] of valuesByFieldId.entries()) {
                await client.query(dataSql, [submissionId, fieldId, serializeFieldValue(value)])
            }
            
            return { submissionId, form, status }
        })

        const { submissionId, form, status } = result

        try {
            if (req.user?.email) {
                await sendTemplatedMail(req.user.email, {
                    title: form.title,
                    status: status,
                    ownerEmail: form.creator_email,
                    actionUrl: `${req.server.appConfig.FRONTEND_URL}/submissions/${submissionId}`,
                    actionText: 'View Submission',
                    submissionId: submissionId

                })
            }
        } catch (emailError) {
            req.log.error({ err: emailError }, 'Error sending confirmation email')
        }

        res.status(201).send({ id: submissionId })
    } catch (error: any) {
        if (error.statusCode) {
            return res.status(error.statusCode).send({ error: error.message })
        }
        return sendInternalServerError(res, 'Error creating submission:', error)
    }
}