-- Update template field
UPDATE template_fields
SET
    field_type = $2,
    title = $3,
    description = $4,
    required = $5,
    options = $6,
    field_order = $7
WHERE
    id = $1 AND template_id = $8
RETURNING id, template_id, field_type, title, description, required, options, field_order, created_at;