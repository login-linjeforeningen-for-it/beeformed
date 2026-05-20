SELECT
    slug,
    title,
    description,
    anonymous_submissions,
    "limit",
    waitlist,
    multiple_submissions
FROM form_templates
WHERE id = $1;