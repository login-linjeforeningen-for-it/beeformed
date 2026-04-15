-- Update template field
UPDATE template_fields
SET
    field_type = $2,
    title = $3,
    description = $4,
    required = $5,
    options = $6,
    validation = $7,
    field_order = $8
WHERE
    id = $1
RETURNING *;