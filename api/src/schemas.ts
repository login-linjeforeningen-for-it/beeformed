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
export const createOrUpdateFormBodySchema = z.object({
    slug: slugSchema,
    title: titleSchema,
    description: descriptionSchema,
    anonymous_submissions: z.boolean().optional(),
    limit: limitSchema,
    waitlist: z.boolean().optional(),
    multiple_submissions: z.boolean().optional(),
    published_at: z.string().min(1),
    expires_at: z.string().min(1)
})

export type CreateOrUpdateFormBody = z.infer<typeof createOrUpdateFormBodySchema>

// Template body
export const createTemplateBodySchema = createOrUpdateFormBodySchema.extend({
    source_form_id: z.string().nullable().optional()
})

export type CreateTemplateBody = z.infer<typeof createTemplateBodySchema>

export const updateTemplateBodySchema = createOrUpdateFormBodySchema

export type UpdateTemplateBody = z.infer<typeof updateTemplateBodySchema>

// Permission grant
export const permissionGrantBodySchema = z.object({
    user_email: z.string().email().nullable().optional(),
    group: z.string().nullable().optional()
})

export type PermissionGrantBody = z.infer<typeof permissionGrantBodySchema>

// Submission
const submissionFieldInputSchema = z.object({
    field_id: z.string().min(1),
    value: z.unknown().optional()
})

export const createSubmissionBodySchema = z.object({
    fields: z.array(submissionFieldInputSchema).max(100)
})

export type CreateSubmissionBody = z.infer<typeof createSubmissionBodySchema>
export type SubmissionFieldInput = z.infer<typeof submissionFieldInputSchema>

// Scan submission
export const scanSubmissionBodySchema = z.object({
    form_id: z.string().min(1)
})

export type ScanSubmissionBody = z.infer<typeof scanSubmissionBodySchema>

// Bulk field operations
const fieldDataSchema = z.object({
    field_type: z.enum(VALID_FIELD_TYPES).optional(),
    title: z.string().max(MAX_FIELD_TITLE_LENGTH, 'title must be at most 255 characters').optional(),
    description: z.string().max(MAX_FIELD_DESCRIPTION_LENGTH, 'description must be at most 2000 characters').nullable().optional(),
    required: z.boolean().optional(),
    options: z.array(z.string()).nullable().optional(),
    validation: z.unknown().optional(),
    field_order: z.number().int().min(0).optional()
}).passthrough()

const bulkFieldOperationSchema = z.object({
    operation: z.enum(['create', 'update', 'delete']),
    id: z.string().optional(),
    data: fieldDataSchema.extend({ form_id: z.string().optional() }).optional()
})

export const bulkFormFieldBodySchema = z.array(bulkFieldOperationSchema).max(100)

export type BulkFormFieldOperation = z.infer<typeof bulkFieldOperationSchema>

const bulkTemplateFieldOperationSchema = z.object({
    operation: z.enum(['create', 'update', 'delete']),
    id: z.string().optional(),
    data: fieldDataSchema.extend({ template_id: z.string().optional() }).optional()
})

export const bulkTemplateFieldBodySchema = z.array(bulkTemplateFieldOperationSchema).max(100)

export type BulkTemplateFieldOperation = z.infer<typeof bulkTemplateFieldOperationSchema>

// Params
export const idParamsSchema = z.object({
    id: z.string()
})

export const formIdAndIdParamsSchema = z.object({
    formId: z.string(),
    id: z.string()
})

export const templateIdAndIdParamsSchema = z.object({
    templateId: z.string(),
    id: z.string()
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
