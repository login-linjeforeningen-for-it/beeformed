-- Delete form field
DELETE FROM form_fields WHERE id = $1 AND form_id = $2;