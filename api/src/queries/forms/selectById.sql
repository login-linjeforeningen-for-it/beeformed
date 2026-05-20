-- Get form by ID with all related information
SELECT
    f.id, f.user_id, f.slug, f.title, f.description, f.anonymous_submissions,
    f.limit, f.waitlist, f.multiple_submissions, f.published_at, f.expires_at,
    f.created_at, f.updated_at,
    u.name as creator_name,
    u.email as creator_email,
    (SELECT COUNT(*)::int FROM submissions s WHERE s.form_id = f.id AND s.status = 'registered') as registered_count,
    COALESCE(json_agg(
        jsonb_build_object(
            'id', ff.id,
            'field_type', ff.field_type,
            'title', ff.title,
            'description', ff.description,
            'required', ff.required,
            'options', ff.options,
            'field_order', ff.field_order
        ) ORDER BY ff.field_order
    ) FILTER (WHERE ff.id IS NOT NULL), '[]'::json) as fields
FROM forms f
LEFT JOIN users u ON f.user_id = u.user_id
LEFT JOIN form_fields ff ON f.id = ff.form_id
WHERE (f.id::text = $1 OR f.slug = $1)
GROUP BY f.id, u.name, u.email;