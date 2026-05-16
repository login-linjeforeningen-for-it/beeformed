SELECT
    slug,
    title,
    description,
    anonymous_submissions,
    "limit",
    waitlist,
    multiple_submissions,
    published_at,
    expires_at
FROM form_templates
WHERE id = $1;