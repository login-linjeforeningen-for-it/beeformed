import { z } from 'zod'

// Shared constants
export const MAX_SLUG_LENGTH = 100
export const MAX_TITLE_LENGTH = 255
export const MAX_DESCRIPTION_LENGTH = 5000
export const MAX_FIELD_TITLE_LENGTH = 255
export const MAX_FIELD_DESCRIPTION_LENGTH = 2000

const SLUG_PATTERN = /^[a-z0-9-_]+$/

export const VALID_FIELD_TYPES = [
    'text', 'textarea', 'number', 'select', 'radio', 'checkbox', 'date', 'time', 'datetime'
] as const

// Reusable pieces
const slugSchema = z.string()
    .min(1, 'slug is required')
    .max(MAX_SLUG_LENGTH, 'slug must be at most 100 characters')
    .regex(SLUG_PATTERN, 'Slug can only contain lowercase letters, numbers, hyphens, and underscores')

const titleSchema = z.string()
    .min(1, 'title is required')
    .max(MAX_TITLE_LENGTH, 'title must be at most 255 characters')

const descriptionSchema = z.string()
    .max(MAX_DESCRIPTION_LENGTH, 'description must be at most 5000 characters')
    .nullable()
    .optional()

const limitSchema = z.number()
    .int('limit must be an integer')
    .min(1, 'limit must be a positive integer')
    .nullable()
    .optional()

// Form body
const formBodyShape = z.object({
    slug: slugSchema,
    title: titleSchema,
    description: descriptionSchema,
    anonymous_submissions: z.boolean().optional(),
    limit: limitSchema,
    waitlist: z.boolean().optional(),
    multiple_submissions: z.boolean().optional(),
    published_at: z.iso.datetime({ offset: true }),
    expires_at: z.iso.datetime({ offset: true })
})

export const createOrUpdateFormBodySchema = formBodyShape
    .refine(d => !(d.anonymous_submissions && d.waitlist), {
        message: 'Waitlist cannot be enabled for anonymous submission forms',
        path: ['waitlist']
    })
    .refine(d => !(d.anonymous_submissions && !d.multiple_submissions), {
        message: 'multiple_submissions must be enabled when anonymous_submissions is enabled',
        path: ['multiple_submissions']
    })
    .refine(d => new Date(d.published_at) < new Date(d.expires_at), {
        message: 'expires_at must be later than published_at',
        path: ['expires_at']
    })
export type CreateOrUpdateFormBody = z.infer<typeof createOrUpdateFormBodySchema>

// Template body (no dates)
const templateBodyShape = z.object({
    slug: slugSchema,
    title: titleSchema,
    description: descriptionSchema,
    anonymous_submissions: z.boolean().optional(),
    limit: limitSchema,
    waitlist: z.boolean().optional(),
    multiple_submissions: z.boolean().optional(),
})

export const createTemplateBodySchema = templateBodyShape
    .extend({ source_form_id: z.string().nullable().optional() })
    .refine(d => !(d.anonymous_submissions && d.waitlist), {
        message: 'Waitlist cannot be enabled for anonymous submission forms',
        path: ['waitlist']
    })
    .refine(d => !(d.anonymous_submissions && !d.multiple_submissions), {
        message: 'multiple_submissions must be enabled when anonymous_submissions is enabled',
        path: ['multiple_submissions']
    })
export type CreateTemplateBody = z.infer<typeof createTemplateBodySchema>

export const updateTemplateBodySchema = templateBodyShape
    .refine(d => !(d.anonymous_submissions && d.waitlist), {
        message: 'Waitlist cannot be enabled for anonymous submission forms',
        path: ['waitlist']
    })
    .refine(d => !(d.anonymous_submissions && !d.multiple_submissions), {
        message: 'multiple_submissions must be enabled when anonymous_submissions is enabled',
        path: ['multiple_submissions']
    })
export type UpdateTemplateBody = z.infer<typeof updateTemplateBodySchema>

// Body for POST /forms/:id/templates
export const createTemplateFromFormBodySchema = z.object({
    title: titleSchema,
    slug: slugSchema,
})
export type CreateTemplateFromFormBody = z.infer<typeof createTemplateFromFormBodySchema>

// Body for POST /forms/:id/duplicate
export const duplicateFormBodySchema = z.object({
    published_at: z.iso.datetime({ offset: true }),
    expires_at: z.iso.datetime({ offset: true }),
    title: titleSchema,
    slug: slugSchema,
}).refine(d => new Date(d.published_at) < new Date(d.expires_at), {
    message: 'expires_at must be later than published_at',
    path: ['expires_at']
})
export type DuplicateFormBody = z.infer<typeof duplicateFormBodySchema>

// Body for POST /templates/:id/form
export const toFormBodySchema = z.object({
    published_at: z.iso.datetime({ offset: true }),
    expires_at: z.iso.datetime({ offset: true }),
    title: titleSchema,
    slug: slugSchema,
}).refine(d => new Date(d.published_at) < new Date(d.expires_at), {
    message: 'expires_at must be later than published_at',
    path: ['expires_at']
})
export type ToFormBody = z.infer<typeof toFormBodySchema>

// Permission grant
export const permissionGrantBodySchema = z.object({
    user_email: z.string().email().nullable().optional(),
    group: z.string().max(255).nullable().optional()
})
    .refine(d => d.user_email || d.group, {
        message: 'At least one of user_email or group must be defined',
        path: ['user_email']
    })
    .refine(d => !(d.user_email && d.group), {
        message: 'Only one of user_email or group can be defined',
        path: ['group']
    })
export type PermissionGrantBody = z.infer<typeof permissionGrantBodySchema>

// Submission
const MAX_SUBMISSION_VALUE_LENGTH = 10_000
const MAX_SUBMISSION_SELECTIONS = 50

const submissionFieldValueSchema = z.union([
    z.string().max(MAX_SUBMISSION_VALUE_LENGTH, 'value is too long'),
    z.number(),
    z.boolean(),
    z.array(z.string().max(500, 'selection is too long')).max(MAX_SUBMISSION_SELECTIONS, 'too many selections')
])

const submissionFieldInputSchema = z.object({
    field_id: z.string().trim().min(1, 'field_id must be a non-empty string'),
    value: submissionFieldValueSchema.nullable().optional()
})

export const createSubmissionBodySchema = z.object({
    fields: z.array(submissionFieldInputSchema)
        .max(100)
        .refine(
            fields => new Set(fields.map(f => f.field_id)).size === fields.length,
            { message: 'Duplicate field_id values in submission' }
        )
})

export type CreateSubmissionBody = z.infer<typeof createSubmissionBodySchema>

export const scanParamsSchema = z.object({
    id: z.uuid({version: 'v7'}),
    submissionId: z.uuid({version: 'v7'})
})

export type ScanParams = z.infer<typeof scanParamsSchema>

// Bulk field operations
const fieldDataSchema = z.object({
    field_type: z.enum(VALID_FIELD_TYPES),
    title: z.string().min(1, 'title is required').max(MAX_FIELD_TITLE_LENGTH, 'title must be at most 255 characters'),
    description: z.string().max(MAX_FIELD_DESCRIPTION_LENGTH, 'description must be at most 2000 characters').nullable().optional(),
    required: z.boolean(),
    options: z.array(z.string().max(500, 'option must be at most 500 characters')).nullable().optional(),
    field_order: z.number().int().min(0)
})

const bulkFormFieldOperationSchema = z.discriminatedUnion('operation', [
    z.object({ operation: z.literal('delete'), id: z.string() }),
    z.object({ operation: z.literal('update'), id: z.string(), data: fieldDataSchema }),
    z.object({ operation: z.literal('create'), data: fieldDataSchema.extend({ form_id: z.string().optional() }) }),
])

export const bulkFormFieldBodySchema = z.array(bulkFormFieldOperationSchema).max(100)
export type BulkFormFieldOperation = z.infer<typeof bulkFormFieldOperationSchema>

const bulkTemplateFieldOperationSchema = z.discriminatedUnion('operation', [
    z.object({ operation: z.literal('delete'), id: z.string() }),
    z.object({ operation: z.literal('update'), id: z.string(), data: fieldDataSchema }),
    z.object({ operation: z.literal('create'), data: fieldDataSchema.extend({ template_id: z.string().optional() }) }),
])

export const bulkTemplateFieldBodySchema = z.array(bulkTemplateFieldOperationSchema).max(100)
export type BulkTemplateFieldOperation = z.infer<typeof bulkTemplateFieldOperationSchema>

// Params
export const idParamsSchema = z.object({
    id: z.uuid({version: 'v7'})
})

export const slugOrIdParamsSchema = z.object({
    id: z.string()
})

export const formIdAndIdParamsSchema = z.object({
    formId: z.uuid({version: 'v7'}),
    id: z.uuid({version: 'v7'})
})

export const templateIdAndIdParamsSchema = z.object({
    templateId: z.uuid({version: 'v7'}),
    id: z.uuid({version: 'v7'})
})

// Query strings
export const listQuerystringSchema = z.object({
    search: z.string().optional(),
    limit: z.string().optional(),
    offset: z.string().optional(),
    order_by: z.string().optional(),
    sort: z.string().optional()
})

export const submissionsByFormQuerystringSchema = listQuerystringSchema.extend({
    include_answers: z.string().optional()
})

export const submissionByIdQuerystringSchema = z.object({
    formId: z.string().optional()
})

export type IdParams = z.infer<typeof idParamsSchema>
export type SlugOrIdParams = z.infer<typeof slugOrIdParamsSchema>
export type FormIdAndIdParams = z.infer<typeof formIdAndIdParamsSchema>
export type TemplateIdAndIdParams = z.infer<typeof templateIdAndIdParamsSchema>
export type ListQuerystring = z.infer<typeof listQuerystringSchema>
export type SubmissionsByFormQuerystring = z.infer<typeof submissionsByFormQuerystringSchema>
export type SubmissionByIdQuerystring = z.infer<typeof submissionByIdQuerystringSchema>

export type SourceEntity = {
    slug: string
    title: string
    description: string | null
    anonymous_submissions: boolean
    limit: number | null
    waitlist: boolean
    multiple_submissions: boolean
    published_at: Date
    expires_at: Date
}
