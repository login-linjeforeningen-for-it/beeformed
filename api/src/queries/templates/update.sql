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
    updated_at = NOW()
WHERE id = $1
RETURNING id, user_id, source_form_id, slug, title, description, anonymous_submissions, "limit", waitlist, multiple_submissions, created_at, updated_at;