SELECT fp.id, f.user_id AS form_owner_id
FROM form_permissions fp
JOIN forms f ON fp.form_id = f.id
WHERE fp.id = $1 AND (f.id::text = $2 OR f.slug = $2)
FOR UPDATE OF fp
