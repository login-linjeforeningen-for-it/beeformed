SELECT * FROM form_fields 
WHERE 
    form_id = $1
ORDER BY
    field_order ASC;