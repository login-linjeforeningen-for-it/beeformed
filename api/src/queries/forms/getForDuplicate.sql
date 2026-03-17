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
FROM forms
WHERE id = $1;