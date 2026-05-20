-- Get shared forms for user
SELECT
    f.id, f.user_id, f.slug, f.title, f.description, f.anonymous_submissions,
    f.limit, f.waitlist, f.multiple_submissions, f.published_at, f.expires_at,
    f.created_at, f.updated_at
FROM forms f
WHERE EXISTS (
    SELECT 1 FROM form_permissions fp
    WHERE fp.form_id = f.id AND (fp.user_id = $1 OR fp.group = ANY($2))
)
