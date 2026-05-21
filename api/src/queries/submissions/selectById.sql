SELECT s.id, s.form_id, f.title as form_title, u.email as user_email, u.name as user_name, s.status, s.submitted_at,
    COALESCE(json_agg(json_build_object('field_id', sd.field_id, 'value', sd.value)) FILTER (WHERE sd.field_id IS NOT NULL), '[]'::json) as data,
    CASE WHEN s.status = 'waitlisted' THEN (
        SELECT COUNT(*)::int + 1
        FROM submissions s2
        WHERE s2.form_id = s.form_id
          AND s2.status = 'waitlisted'
          AND s2.submitted_at < s.submitted_at
    ) ELSE NULL END as waitlist_position
FROM submissions s
LEFT JOIN users u ON s.user_id = u.user_id
LEFT JOIN forms f ON s.form_id = f.id
LEFT JOIN submission_data sd ON s.id = sd.submission_id
WHERE s.id = $1
  AND (
    s.user_id = $2
    OR f.user_id = $2
    OR EXISTS (
        SELECT 1 FROM form_permissions fp
        WHERE fp.form_id = f.id
          AND (fp.user_id = $2 OR fp.group = ANY($4))
    )
  )
  AND ($3::text IS NULL OR s.form_id::text = $3::text)
GROUP BY s.id, f.title, u.email, u.name
