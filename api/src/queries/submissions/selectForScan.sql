SELECT s.id, s.form_id, s.scanned_at, s.status,
       u.name AS user_name, u.email AS user_email, f.title AS form_title,
       (f.user_id = $2 OR EXISTS(
           SELECT 1 FROM form_permissions fp
           WHERE fp.form_id = f.id AND (fp.user_id = $2 OR fp."group" = ANY($3))
       )) AS has_permission
FROM submissions s
JOIN forms f ON s.form_id = f.id
LEFT JOIN users u ON s.user_id = u.user_id
WHERE s.id = $1
FOR UPDATE OF s
