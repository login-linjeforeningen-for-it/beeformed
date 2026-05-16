SELECT s.id, u.email as user_email, u.name as user_name, s.submitted_at, s.status, s.scanned_at,
    COUNT(*) OVER() as total_count,
    COALESCE(
        json_agg(
            json_build_object('field_id', sd.field_id, 'value', sd.value)
        ) FILTER (WHERE sd.field_id IS NOT NULL), 
        '[]'
    ) as answers
FROM submissions s
LEFT JOIN users u ON s.user_id = u.user_id
LEFT JOIN submission_data sd ON s.id = sd.submission_id
WHERE s.form_id = $1
GROUP BY s.id, u.email, u.name
