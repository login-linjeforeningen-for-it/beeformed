SELECT tp.id, ft.user_id AS template_owner_id
FROM template_permissions tp
JOIN form_templates ft ON tp.template_id = ft.id
WHERE tp.id = $1
FOR UPDATE OF tp
