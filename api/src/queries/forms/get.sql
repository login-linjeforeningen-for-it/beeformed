-- Get form by ID with all related information
SELECT
    f.*,
    u.name as creator_name,
    u.email as creator_email,
    (SELECT COUNT(*) FROM submissions s WHERE s.form_id = f.id AND s.status = 'registered') as registered_count,
    COALESCE(json_agg(
        DISTINCT jsonb_build_object(
            'id', ff.id,
            'field_type', ff.field_type,
            'title', ff.title,
            'description', ff.description,
            'required', ff.required,
            'options', ff.options,
            'validation', ff.validation,
            'field_order', ff.field_order
        )
    ) FILTER (WHERE ff.id IS NOT NULL), '[]'::json) as fields
FROM forms f
LEFT JOIN users u ON f.user_id = u.user_id
LEFT JOIN form_fields ff ON f.id = ff.form_id
WHERE (f.id::text = $1 OR f.slug = $1)
GROUP BY f.id, u.name, u.email;