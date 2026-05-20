-- Get forms by user ID
SELECT
    id, user_id, slug, title, description, anonymous_submissions,
    "limit", waitlist, multiple_submissions, published_at, expires_at,
    created_at, updated_at
FROM forms
WHERE user_id = $1