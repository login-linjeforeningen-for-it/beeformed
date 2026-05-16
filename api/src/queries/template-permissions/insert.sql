-- Create template permission
INSERT INTO template_permissions (
    template_id,
    user_id,
    "group",
    granted_by
)
VALUES (
    $1,
    $2,
    $3,
    $4
)
RETURNING *;