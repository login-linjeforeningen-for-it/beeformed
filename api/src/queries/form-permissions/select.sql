-- Get all permissions for a specific form
SELECT
    fp.id,
    fp.form_id,
    u.email as user_email,
    fp."group",
    gu.email as granted_by_email,
    fp.created_at,
    fp.updated_at
FROM form_permissions fp
LEFT JOIN users u ON fp.user_id = u.user_id
LEFT JOIN users gu ON fp.granted_by = gu.user_id
WHERE fp.form_id = $1;