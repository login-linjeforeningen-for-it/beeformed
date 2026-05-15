import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import run, { runInTransaction } from '#db'
import { loadSQL } from '#utils/sql.ts'
import { logError } from '#utils/logger.ts'
import { createHttpError } from '#utils/httpError.ts'

type PermissionGrantConfig = {
    resourceTable: 'forms' | 'form_templates'
    resourceLabel: 'Form' | 'Template'
    requiredResourceIdMessage: string
    insertSQLPath: string
}

export async function handlePermissionGrant(
    req: AuthenticatedRequest<{ Params: IdParams; Body: PermissionGrantBody }>,
    res: FastifyReply,
    config: PermissionGrantConfig
) {
    const body = req.body

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

    const resourceId = req.params.id
    const grantedBy = req.user.id

    if (!/^[a-z_]+$/.test(config.resourceTable)) {
        throw new Error(`Unsafe SQL identifier: ${config.resourceTable}`)
    }

    const sql = await loadSQL(config.insertSQLPath)

    try {
        const newPermission = await runInTransaction(async (client) => {
            const ownerResult = await client.query(
                `SELECT user_id FROM ${config.resourceTable} WHERE id = $1 FOR UPDATE`,
                [resourceId]
            )

            if (ownerResult.rows.length === 0) {
                throw createHttpError(404, `${config.resourceLabel} not found`)
            }

            if ((ownerResult.rows[0].user_id as string) !== grantedBy) {
                throw createHttpError(403, 'Forbidden')
            }

            const result = await client.query(sql, [resourceId, userId, body.group || null, grantedBy])
            return result.rows[0]
        })

        return res.status(201).send(newPermission)
    } catch (error) {
        const statusCode = (error as Error & { statusCode?: number }).statusCode
        if (statusCode === 404) return res.status(404).send({ error: (error as Error).message })
        if (statusCode === 403) return res.status(403).send({ error: 'Forbidden' })
        logError('Error creating entity', { event: 'http.internal_error', error })
        return res.status(500).send({ error: 'Internal server error' })
    }
}
