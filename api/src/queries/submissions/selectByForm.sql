SELECT s.id, u.email as user_email, u.name as user_name, s.submitted_at, s.status, s.scanned_at
FROM submissions s
LEFT JOIN users u ON s.user_id = u.user_id
WHERE s.form_id = $1