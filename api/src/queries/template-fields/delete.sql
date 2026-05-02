-- Delete template field
DELETE FROM template_fields WHERE id = $1 AND template_id = $2;