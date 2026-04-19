-- Check if user has permission to access a form
SELECT EXISTS(
    SELECT 1
    FROM form_permissions fp
    JOIN forms f ON f.id = fp.form_id
    WHERE (f.id::text = $1 OR f.slug = $1)
    AND (fp.user_id = $2 OR fp."group" = ANY($3))
) OR EXISTS(
    SELECT 1 FROM forms
    WHERE (id::text = $1 OR slug = $1) AND user_id = $2
) AS has_permission;
