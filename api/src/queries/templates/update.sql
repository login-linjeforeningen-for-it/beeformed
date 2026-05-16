-- Update template
UPDATE form_templates
SET
    slug = $2,
    title = $3,
    description = $4,
    anonymous_submissions = $5,
    "limit" = $6,
    waitlist = $7,
    multiple_submissions = $8,
    published_at = $9,
    expires_at = $10,
    updated_at = NOW()
WHERE id = $1
RETURNING *;