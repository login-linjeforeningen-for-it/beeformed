const formBodyProperties = {
    slug: { type: 'string' },
    title: { type: 'string' },
    description: { type: ['string', 'null'] },
    anonymous_submissions: { type: 'boolean' },
    limit: { type: ['number', 'null'] },
    waitlist: { type: 'boolean' },
    multiple_submissions: { type: 'boolean' },
    published_at: { type: 'string' },
    expires_at: { type: 'string' }
} as const

export const createOrUpdateFormBodySchema = {
    type: 'object',
    required: ['slug', 'title', 'published_at', 'expires_at'],
    additionalProperties: false,
    properties: formBodyProperties
}

export const createTemplateBodySchema = {
    type: 'object',
    required: ['slug', 'title', 'published_at', 'expires_at'],
    additionalProperties: false,
    properties: {
        ...formBodyProperties,
        source_form_id: { type: ['string', 'null'] }
    }
}

export const updateTemplateBodySchema = {
    type: 'object',
    required: ['slug', 'title', 'published_at', 'expires_at'],
    additionalProperties: false,
    properties: formBodyProperties
}

export const permissionGrantBodySchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        user_email: { type: ['string', 'null'] },
        group: { type: ['string', 'null'] }
    }
}

export const createSubmissionBodySchema = {
    type: 'object',
    required: ['fields'],
    additionalProperties: false,
    properties: {
        fields: {
            type: 'array',
            maxItems: 100,
            items: {
                type: 'object',
                required: ['field_id'],
                additionalProperties: false,
                properties: {
                    field_id: { type: 'string' },
                    value: {}
                }
            }
        }
    }
}

export const scanSubmissionBodySchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        form_id: { type: 'string' }
    }
}

const fieldOperationDataProperties = {
    type: 'object',
    additionalProperties: true,
    properties: {
        field_type: { type: 'string' },
        title: { type: 'string' },
        description: { type: ['string', 'null'] },
        required: { type: 'boolean' },
        options: { type: ['array', 'null'], items: { type: 'string' } },
        validation: {},
        field_order: { type: 'number' }
    }
}

const bulkFieldOperationItem = {
    type: 'object',
    required: ['operation'],
    additionalProperties: false,
    properties: {
        operation: { type: 'string', enum: ['create', 'update', 'delete'] },
        id: { type: 'string' },
        data: fieldOperationDataProperties
    }
}

export const bulkFormFieldBodySchema = {
    type: 'array',
    items: {
        ...bulkFieldOperationItem,
        properties: {
            ...bulkFieldOperationItem.properties,
            data: {
                ...fieldOperationDataProperties,
                properties: {
                    ...fieldOperationDataProperties.properties,
                    form_id: { type: 'string' }
                }
            }
        }
    }
}

export const bulkTemplateFieldBodySchema = {
    type: 'array',
    items: {
        ...bulkFieldOperationItem,
        properties: {
            ...bulkFieldOperationItem.properties,
            data: {
                ...fieldOperationDataProperties,
                properties: {
                    ...fieldOperationDataProperties.properties,
                    template_id: { type: 'string' }
                }
            }
        }
    }
}
