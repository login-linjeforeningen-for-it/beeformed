INSERT INTO form_fields (form_id, field_type, title, description, required, options, field_order)
SELECT $1, field_type, title, description, required, options, field_order
FROM template_fields
WHERE template_id = $2;
