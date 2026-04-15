-- Check if user has permission to access a template
SELECT EXISTS(
    SELECT 1 FROM template_permissions
    WHERE template_id = $1 AND (user_id = $2 OR "group" = ANY($3))
) OR EXISTS(
    SELECT 1 FROM form_templates
    WHERE id = $1 AND user_id = $2
) AS has_permission;