import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { sendInternalServerError } from '#utils/http/errors.ts'
import type { AuthRequest } from '#utils/auth/authMiddleware.ts'

type PermissionGrantBody = {
    user_email?: string | null
    group?: string | null
}

type PermissionGrantConfig = {
    resourceTable: 'forms' | 'form_templates'
    resourceLabel: 'Form' | 'Template'
    requiredResourceIdMessage: string
    insertSQLPath: string
}

export async function handlePermissionGrant(
    req: AuthRequest<any>,
    config: PermissionGrantConfig
) {
    const body = await req.json() as PermissionGrantBody
    const params = req.params as { id?: string }

    if (!body.user_email && !body.group) {
        return Response.json({ error: 'At least one of user_email or group must be defined' }, { status: 400 })
    }

    if (body.user_email && body.group) {
        return Response.json({ error: 'Only one of user_email or group can be defined' }, { status: 400 })
    }

    let userId: string | null = null
    if (body.user_email) {
        const userResult = await run('SELECT user_id FROM users WHERE email = $1', [body.user_email])
        if (userResult.rows.length === 0) {
            return Response.json({ error: 'User with this email not found' }, { status: 400 })
        }
        userId = userResult.rows[0].user_id as string
    }

    const resourceId = params.id
    const grantedBy = req.user.id

    if (!resourceId || !grantedBy) {
        return Response.json({ error: config.requiredResourceIdMessage }, { status: 400 })
    }

    const ownerResult = await run(
        `SELECT user_id FROM ${config.resourceTable} WHERE id = $1`,
        [resourceId]
    )

    if (ownerResult.rows.length === 0) {
        return Response.json({ error: `${config.resourceLabel} not found` }, { status: 404 })
    }

    if ((ownerResult.rows[0].user_id as string) !== grantedBy) {
        return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
        const sql = await loadSQL(config.insertSQLPath)
        const result = await run(sql, [resourceId, userId, body.group || null, grantedBy])
        return Response.json(result.rows[0], { status: 201 })
    } catch (error) {
        return sendInternalServerError('Error creating entity:', error)
    }
}
