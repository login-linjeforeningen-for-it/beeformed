-- Create template field
INSERT INTO template_fields (
    template_id,
    field_type,
    title,
    description,
    required,
    options,
    field_order
)
VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    $6,
    $7
)
RETURNING id, template_id, field_type, title, description, required, options, field_order, created_at;