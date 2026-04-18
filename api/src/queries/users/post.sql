-- Create user
INSERT INTO users
(
    user_id,
    email,
    name,
    last_active_at
)
VALUES (
    $1,
    $2,
    $3,
    CURRENT_TIMESTAMP
)
ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    last_active_at = CURRENT_TIMESTAMP,
    inactivity_warning_sent_at = NULL
RETURNING *;