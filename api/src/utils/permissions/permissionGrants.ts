import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import type { PermissionGrantBody } from '#/schemas.ts'
import run, { runInTransaction } from '#db'
import { loadSQL, assertSafeIdentifier } from '#utils/sql.ts'
import { logError } from '#utils/logger.ts'

type PermissionGrantConfig = {
    resourceTable: 'forms' | 'form_templates'
    resourceLabel: 'Form' | 'Template'
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

    assertSafeIdentifier(config.resourceTable, 'resourceTable')

    const sql = await loadSQL(config.insertSQLPath)

    try {
        const newPermission = await runInTransaction(async (client) => {
            const ownerResult = await client.query(
                `SELECT user_id FROM ${config.resourceTable} WHERE id = $1 FOR UPDATE`,
                [resourceId]
            )

            if (ownerResult.rows.length === 0) {
                throw Object.assign(new Error(`${config.resourceLabel} not found`), { statusCode: 404 })
            }

            if ((ownerResult.rows[0].user_id as string) !== grantedBy) {
                throw Object.assign(new Error('Forbidden'), { statusCode: 403 })
            }

            const result = await client.query(sql, [resourceId, userId, body.group || null, grantedBy])
            return result.rows[0]
        })

        return res.status(201).send(newPermission)
    } catch (error) {
        const statusCode = (error as Error & { statusCode?: number }).statusCode
        if (statusCode === 404) return res.status(404).send({ error: (error as Error).message })
        if (statusCode === 403) return res.status(403).send({ error: 'Forbidden' })
        if ((error as { code?: string }).code === '23505') return res.status(409).send({ error: 'Permission already exists' })
        logError('Error creating entity', { event: 'http.internal_error', error })
        return res.status(500).send({ error: 'Internal server error' })
    }
}

export async function handlePermissionGet(
    req: AuthenticatedRequest<{ Params: IdParams }>,
    res: FastifyReply,
    sqlPath: string
) {
    try {
        const sql = await loadSQL(sqlPath)
        const result = await run(sql, [req.params.id])
        return res.send({ data: result.rows, total: result.rows.length })
    } catch (error) {
        logError('Error reading entity', { event: 'http.internal_error', requestId: req.id, error })
        return res.status(500).send({ error: 'Internal server error' })
    }
}

type DeletePermissionConfig = {
    checkSqlPath: string
    ownerField: string
    deleteSqlPath: string
}

export async function handlePermissionDelete(
    req: AuthenticatedRequest<{ Params: { id: string } }>,
    res: FastifyReply,
    config: DeletePermissionConfig
) {
    try {
        await runInTransaction(async (client) => {
            const checkSql = await loadSQL(config.checkSqlPath)
            const checkResult = await client.query(checkSql, [req.params.id])

            if (checkResult.rows.length === 0) {
                throw Object.assign(new Error('Permission not found'), { statusCode: 404 })
            }

            if (checkResult.rows[0][config.ownerField] !== req.user.id) {
                throw Object.assign(new Error('Forbidden'), { statusCode: 403 })
            }

            const sql = await loadSQL(config.deleteSqlPath)
            await client.query(sql, [req.params.id, req.user.id])
        })
        return res.status(204).send()
    } catch (error) {
        const statusCode = (error as Error & { statusCode?: number }).statusCode
        if (statusCode === 404) return res.status(404).send({ error: (error as Error).message })
        if (statusCode === 403) return res.status(403).send({ error: 'Forbidden' })
        logError('Error deleting entity', { event: 'http.internal_error', requestId: req.id, error })
        return res.status(500).send({ error: 'Internal server error' })
    }
}
