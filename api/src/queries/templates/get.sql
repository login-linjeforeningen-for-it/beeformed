-- Get template by ID with all related information
SELECT
    t.*,
    u.name as creator_name,
    u.email as creator_email,
    COALESCE(json_agg(
        DISTINCT jsonb_build_object(
            'id', tf.id,
            'field_type', tf.field_type,
            'title', tf.title,
            'description', tf.description,
            'required', tf.required,
            'options', tf.options,
            'validation', tf.validation,
            'field_order', tf.field_order
        )
    ) FILTER (WHERE tf.id IS NOT NULL), '[]'::json) as fields
FROM form_templates t
LEFT JOIN users u ON t.user_id = u.user_id
LEFT JOIN template_fields tf ON t.id = tf.template_id
WHERE t.id = $1
GROUP BY t.id, u.name, u.email;