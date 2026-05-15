SELECT s.id, u.email as user_email, u.name as user_name, s.submitted_at, s.status, s.scanned_at,
    COUNT(*) OVER() as total_count
FROM submissions s
LEFT JOIN users u ON s.user_id = u.user_id
LEFT JOIN forms f ON s.form_id = f.id
WHERE s.form_id = $1
GROUP BY s.id, f.title, u.email, u.name, s.status