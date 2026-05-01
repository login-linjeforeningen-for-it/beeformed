SELECT s.id, s.form_id, s.status, f.expires_at, f."limit", f.title as form_title, f.slug as form_slug, s.user_id, f.user_id as form_owner_id, u.email as user_email
FROM submissions s
JOIN forms f ON s.form_id = f.id
LEFT JOIN users u ON s.user_id = u.user_id
WHERE s.id = $1
FOR UPDATE OF s;
