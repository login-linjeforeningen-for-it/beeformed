SELECT EXISTS(
    SELECT 1 FROM submission_data sd WHERE sd.field_id = ff.id
) AS has_answers
FROM form_fields ff
WHERE ff.id = $1 AND ff.form_id = $2 AND ff.deleted_at IS NULL;
