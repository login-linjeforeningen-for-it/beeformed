import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import type { CreateSubmissionBody, IdParams } from '#schemas.ts'
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
        for (const fieldInput of req.body.fields) {
            const fieldId = fieldInput.field_id
            if (!formFieldById.get(fieldId)) throw new HttpError(400, `Field ${fieldId} does not belong to this form`)
            valuesByFieldId.set(fieldId, fieldInput.value)
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
