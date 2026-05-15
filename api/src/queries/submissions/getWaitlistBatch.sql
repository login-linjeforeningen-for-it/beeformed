SELECT s.id, s.user_id, u.email, u.name
FROM submissions s
JOIN users u ON s.user_id = u.user_id
WHERE s.form_id = $1 AND s.status = 'waitlisted'
ORDER BY s.submitted_at ASC
LIMIT $2
FOR UPDATE SKIP LOCKED;
