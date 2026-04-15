-- Delete template
DELETE FROM form_templates WHERE id = $1 AND user_id = $2;