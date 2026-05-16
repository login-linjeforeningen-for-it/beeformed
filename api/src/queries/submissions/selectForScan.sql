SELECT s.id, s.form_id, s.scanned_at, s.status, u.name as user_name, u.email as user_email, f.title as form_title
FROM submissions s
JOIN forms f ON s.form_id = f.id
LEFT JOIN users u ON s.user_id = u.user_id
WHERE s.id = $1
