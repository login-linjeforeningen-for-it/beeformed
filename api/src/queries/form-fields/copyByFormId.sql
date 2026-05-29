INSERT INTO form_fields (form_id, field_type, title, description, required, options, field_order)
SELECT $1, field_type, title, description, required, options, field_order
FROM form_fields
WHERE form_id = $2 AND deleted_at IS NULL;
