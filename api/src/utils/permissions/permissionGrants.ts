import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { sendInternalServerError } from '#utils/http/errors.ts'

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
    req: FastifyRequest,
    res: FastifyReply,
    config: PermissionGrantConfig
) {
    const body = req.body as PermissionGrantBody
    const params = req.params as { id?: string }

    if (!body.user_email && !body.group) {
        return res.status(400).send({ error: 'At least one of user_email or group must be defined' })
    }

    if (body.user_email && body.group) {
        return res.status(400).send({ error: 'Only one of user_email or group can be defined' })
    }

    let userId: string | null = null
    if (body.user_email) {
        const userResult = await run('SELECT user_id FROM users WHERE email = $1', [body.user_email])
        if (userResult.rows.length === 0) {
            return res.status(400).send({ error: 'User with this email not found' })
        }
        userId = userResult.rows[0].user_id as string
    }

    const resourceId = params.id
    const grantedBy = req.user!.id

    if (!resourceId || !grantedBy) {
        return res.status(400).send({ error: config.requiredResourceIdMessage })
    }

    const ownerResult = await run(
        `SELECT user_id FROM ${config.resourceTable} WHERE id = $1`,
        [resourceId]
    )

    if (ownerResult.rows.length === 0) {
        return res.status(404).send({ error: `${config.resourceLabel} not found` })
    }

    if ((ownerResult.rows[0].user_id as string) !== grantedBy) {
        return res.status(403).send({ error: 'Forbidden' })
    }

    try {
        const sql = await loadSQL(config.insertSQLPath)
        const result = await run(sql, [resourceId, userId, body.group || null, grantedBy])
        return res.status(201).send(result.rows[0])
    } catch (error) {
        return sendInternalServerError(res, 'Error creating entity:', error)
    }
}
