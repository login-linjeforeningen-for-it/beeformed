SELECT EXISTS(
    SELECT 1
    FROM form_templates
    WHERE slug = $1
) AS exists;