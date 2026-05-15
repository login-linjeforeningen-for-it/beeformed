-- Get templates by user ID
SELECT
    id, user_id, source_form_id, slug, title, description, anonymous_submissions,
    "limit", waitlist, multiple_submissions, published_at, expires_at,
    created_at, updated_at,
    COUNT(*) OVER() as total_count
FROM form_templates
WHERE user_id = $1