UPDATE form_fields SET deleted_at = NOW() WHERE id = $1 AND form_id = $2 AND deleted_at IS NULL;
