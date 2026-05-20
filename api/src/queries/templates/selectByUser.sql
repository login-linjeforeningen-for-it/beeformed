-- Get templates by user ID
SELECT
    id, user_id, source_form_id, slug, title, description, anonymous_submissions,
    "limit", waitlist, multiple_submissions, created_at, updated_at
FROM form_templates
WHERE user_id = $1