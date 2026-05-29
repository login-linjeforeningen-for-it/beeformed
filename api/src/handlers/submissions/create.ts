import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import type { CreateSubmissionBody, IdParams } from '#schemas.ts'
import { z } from 'zod'
import config from '#constants'
import { runInTransaction, HttpError } from '#db'
import { loadSQL } from '#utils/db/sql.ts'
import { sendTypedEmail } from '#utils/email/sendSMTP.ts'
import { logError } from '#utils/logger.ts'

const formSql = await loadSQL('forms/selectByIdForUpdate.sql')
const countSql = await loadSQL('submissions/countRegistered.sql')
const checkSubmissionSql = await loadSQL('submissions/checkUserSubmission.sql')
const insertSubmissionSql = await loadSQL('submissions/insert.sql')
const insertDataSql = await loadSQL('submissions/insertData.sql')

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
    if (Array.isArray(value)) return value.some(item => String(item).trim().length > 0)
    if (value === null || value === undefined) return false
    return String(value).trim().length > 0
}

function serializeFieldValue(value: unknown): string | null {
    if (value === null || value === undefined) return null
    if (Array.isArray(value)) return JSON.stringify(value)
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/
const BOOLEAN_STRINGS = ['true', 'false', '1', '0', 'yes', 'no', 'on', 'off']

function isEmptyValue(value: unknown): boolean {
    if (value === null || value === undefined) return true
    if (Array.isArray(value)) return value.length === 0
    if (typeof value === 'string') return value.trim().length === 0
    return false
}

type FieldDefinition = { field_type: string; title: string; options: string[] | null }

function valueSchemaFor(field: FieldDefinition): z.ZodType {
    const options = field.options ?? []

    switch (field.field_type) {
        case 'text':
        case 'textarea':
            return z.string({ error: 'must be text' })
        case 'number':
            return z.union([z.number(), z.string()], { error: 'must be a number' })
                .refine(v => Number.isFinite(typeof v === 'number' ? v : Number(v)), 'must be a number')
        case 'date':
            return z.string({ error: 'must be a valid date (YYYY-MM-DD)' })
                .regex(DATE_RE, 'must be a valid date (YYYY-MM-DD)')
                .refine(s => !Number.isNaN(Date.parse(`${s}T00:00:00Z`)), 'must be a valid date (YYYY-MM-DD)')
        case 'time':
            return z.string({ error: 'must be a valid time (HH:MM)' })
                .regex(TIME_RE, 'must be a valid time (HH:MM)')
        case 'datetime':
            return z.string({ error: 'must be a valid date/time' })
                .refine(s => !Number.isNaN(Date.parse(s)), 'must be a valid date/time')
        case 'select':
        case 'radio': {
            const choice = z.string({ error: 'must be a single choice' })
            return options.length > 0
                ? choice.refine(v => options.includes(v), 'has an invalid selection')
                : choice
        }
        case 'checkbox':
            if (options.length > 0) {
                return z.union([z.string(), z.array(z.string())], { error: 'has an invalid selection' })
                    .refine(v => (Array.isArray(v) ? v : [v]).every(item => options.includes(item)), 'has an invalid selection')
            }
            return z.union([z.boolean(), z.number(), z.string()], { error: 'must be true or false' })
                .refine(v => {
                    if (typeof v === 'boolean') return true
                    if (typeof v === 'number') return v === 0 || v === 1
                    return BOOLEAN_STRINGS.includes(v.trim().toLowerCase())
                }, 'must be true or false')
        default:
            return z.unknown()
    }
}

function validateFieldValue(field: FieldDefinition, value: unknown): string | null {
    if (isEmptyValue(value)) return null
    const result = valueSchemaFor(field).safeParse(value)
    return result.success ? null : `${field.title}: ${result.error.issues[0].message}`
}

export default async function createSubmission(
    req: AuthenticatedRequest<{ Params: IdParams; Body: CreateSubmissionBody }>,
    res: FastifyReply
) {
    const { id: formId } = req.params

    const result = await runInTransaction(async (client) => {
        const formResult = await client.query(formSql, [formId])
        if (formResult.rows.length === 0) throw new HttpError(404, 'Form not found')
        const form = formResult.rows[0]

        const now = new Date()
        if (new Date(form.published_at) > now) throw new HttpError(400, 'Form has not opened yet')
        if (new Date(form.expires_at) <= now) throw new HttpError(400, 'Form has closed')

        const userId = form.anonymous_submissions ? null : req.user.id
        let status: 'registered' | 'waitlisted' = 'registered'

        if (!form.anonymous_submissions && !form.multiple_submissions && userId) {
            const existing = await client.query(checkSubmissionSql, [form.id, userId])
            if (existing.rows[0].count > 0) throw new HttpError(409, 'You have already submitted to this form')
        }

        if (form.limit) {
            const countResult = await client.query(countSql, [form.id])
            const currentCount = Number(countResult.rows[0].count)
            if (currentCount >= form.limit) {
                if (form.waitlist) {
                    status = 'waitlisted'
                } else {
                    throw new HttpError(400, 'Form is full')
                }
            }
        }

        const submissionResult = await client.query(insertSubmissionSql, [form.id, userId, status])
        const submissionId = submissionResult.rows[0].id

        type FormFieldRow = { id: string; title: string; required: boolean; field_type: string; options: string[] | null }
        const fieldsFromForm: FormFieldRow[] = Array.isArray(form.fields) ? form.fields : []
        const formFieldById = new Map<string, FormFieldRow>(fieldsFromForm.map(f => [f.id, f]))

        const valuesByFieldId = new Map<string, unknown>()
        const invalidFields: string[] = []
        for (const fieldInput of req.body.fields) {
            const fieldId = fieldInput.field_id
            const field = formFieldById.get(fieldId)
            if (!field) throw new HttpError(400, `Field ${fieldId} does not belong to this form`)
            const valueError = validateFieldValue(field, fieldInput.value)
            if (valueError) invalidFields.push(valueError)
            valuesByFieldId.set(fieldId, fieldInput.value)
        }

        if (invalidFields.length > 0) {
            throw new HttpError(400, `Invalid field values: ${invalidFields.join(', ')}`)
        }

        const missingRequired = fieldsFromForm
            .filter(f => f.required)
            .filter(f => !hasRequiredFieldValue(f, valuesByFieldId.get(f.id)))
            .map(f => f.title)

        if (missingRequired.length > 0) {
            throw new HttpError(400, `Missing required fields: ${missingRequired.join(', ')}`)
        }

        for (const [fieldId, value] of valuesByFieldId.entries()) {
            await client.query(insertDataSql, [submissionId, fieldId, serializeFieldValue(value)])
        }

        return { submissionId, form, status }
    })

    if (req.user.email) {
        sendTypedEmail('submission', req.user.email, {
            title: result.form.title,
            status: result.status,
            ownerEmail: result.form.creator_email,
            actionUrl: `${config.FRONTEND_URL}/submissions/${result.submissionId}`,
            actionText: 'View Submission',
            submissionId: result.submissionId
        }).catch(emailError => logError('Error sending confirmation email', {
            event: 'submission.confirmation_email_failed',
            submissionId: result.submissionId,
            formId,
            userId: req.user.id,
            requestId: req.id,
            error: emailError
        }))
    }

    return res.status(201).send({ id: result.submissionId, status: result.status })
}
