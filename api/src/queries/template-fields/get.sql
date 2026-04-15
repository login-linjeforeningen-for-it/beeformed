SELECT * FROM template_fields
WHERE
    template_id = $1
ORDER BY
    field_order ASC;