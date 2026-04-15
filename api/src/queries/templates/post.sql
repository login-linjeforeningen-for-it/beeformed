-- Create template
INSERT INTO form_templates (
    user_id,
    source_form_id,
    slug,
    title,
    description,
    anonymous_submissions,
    "limit",
    waitlist,
    multiple_submissions,
    published_at,
    expires_at
)
VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    $6,
    $7,
    $8,
    $9,
    $10,
    $11
)
RETURNING *;