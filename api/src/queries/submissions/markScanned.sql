UPDATE submissions
SET scanned_at = NOW()
WHERE id = $1 AND scanned_at IS NULL
RETURNING scanned_at;
