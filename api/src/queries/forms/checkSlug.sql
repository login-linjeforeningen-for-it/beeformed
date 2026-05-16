SELECT EXISTS(
    SELECT 1
    FROM forms
    WHERE slug = $1
) AS exists;