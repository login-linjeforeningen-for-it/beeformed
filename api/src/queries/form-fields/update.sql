-- Update form field
UPDATE form_fields
SET
    field_type = $2,
    title = $3,
    description = $4,
    required = $5,
    options = $6,
    field_order = $7
WHERE
    id = $1 AND form_id = $8 AND deleted_at IS NULL
RETURNING id, form_id, field_type, title, description, required, options, field_order, created_at;