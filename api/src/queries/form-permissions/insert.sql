-- Create form permission
INSERT INTO form_permissions (
    form_id,
    user_id,
    "group",
    granted_by
)
VALUES 
(
    $1,
    $2,
    $3,
    $4
)
RETURNING *;