-- Get shared templates for user
SELECT t.*, COUNT(*) OVER() as total_count FROM form_templates t
WHERE EXISTS (
    SELECT 1 FROM template_permissions tp
    WHERE tp.template_id = t.id AND (tp.user_id = $1 OR tp.group = ANY($2))
)