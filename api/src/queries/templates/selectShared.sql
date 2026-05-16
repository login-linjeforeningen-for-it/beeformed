-- Get shared templates for user
SELECT
    t.id, t.user_id, t.source_form_id, t.slug, t.title, t.description,
    t.anonymous_submissions, t.limit, t.waitlist, t.multiple_submissions,
    t.published_at, t.expires_at, t.created_at, t.updated_at,
    COUNT(*) OVER() as total_count
FROM form_templates t
WHERE EXISTS (
    SELECT 1 FROM template_permissions tp
    WHERE tp.template_id = t.id AND (tp.user_id = $1 OR tp.group = ANY($2))
)