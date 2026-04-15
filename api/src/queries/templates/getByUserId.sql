-- Get templates by user ID
SELECT *, COUNT(*) OVER() as total_count FROM form_templates WHERE user_id = $1