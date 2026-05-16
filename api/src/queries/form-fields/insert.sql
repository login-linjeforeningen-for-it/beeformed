-- Create form field
INSERT INTO form_fields (
    form_id,
    field_type,
    title,
    description,
    required,
    options,
    validation,
    field_order
)
VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    $6,
    $7,
    $8
)
RETURNING *;