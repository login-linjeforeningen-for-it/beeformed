-- Delete template permission
DELETE FROM template_permissions
WHERE id = $1
AND template_id IN (SELECT id FROM form_templates WHERE user_id = $2);