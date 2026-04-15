-- Get all permissions for a specific template
SELECT
    tp.id,
    tp.template_id,
    u.email as user_email,
    tp."group",
    gu.email as granted_by_email,
    tp.created_at,
    tp.updated_at
FROM template_permissions tp
LEFT JOIN users u ON tp.user_id = u.user_id
LEFT JOIN users gu ON tp.granted_by = gu.user_id
WHERE tp.template_id = $1;