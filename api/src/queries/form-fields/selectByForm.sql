SELECT * FROM form_fields
WHERE
    form_id = $1
    AND deleted_at IS NULL
ORDER BY
    field_order ASC;