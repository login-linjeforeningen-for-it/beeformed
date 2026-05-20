import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import type { PermissionGrantBody, IdParams } from '#schemas.ts'
import run, { runInTransaction, HttpError } from '#db'
import { loadSQL } from '#utils/db/sql.ts'
import { buildListResponse } from '#utils/db/listResponse.ts'

const selectUserByEmailSql = await loadSQL('users/selectByEmail.sql')

type PermissionGrantConfig = {
    resourceLabel: 'Form' | 'Template'
    ownerCheckSqlPath: string
    insertSQLPath: string
}

export async function handlePermissionGrant(
    req: AuthenticatedRequest<{ Params: IdParams; Body: PermissionGrantBody }>,
    res: FastifyReply,
    config: PermissionGrantConfig
) {
    const body = req.body
    const resourceParam = req.params.id
    const grantedBy = req.user.id

    const ownerCheckSql = await loadSQL(config.ownerCheckSqlPath)
    const insertSql = await loadSQL(config.insertSQLPath)

    try {
        const newPermission = await runInTransaction(async (client) => {
            const ownerResult = await client.query(ownerCheckSql, [resourceParam])

            if (ownerResult.rows.length === 0) {
                throw new HttpError(404, `${config.resourceLabel} not found`)
            }

            if ((ownerResult.rows[0].user_id as string) !== grantedBy) {
                throw new HttpError(403, 'Forbidden')
            }

            let userId: string | null = null
            if (body.user_email) {
                const userResult = await client.query(selectUserByEmailSql, [body.user_email])
                if (userResult.rows.length === 0) {
                    throw new HttpError(400, 'User with this email not found')
                }
                userId = userResult.rows[0].user_id as string
            }

            const result = await client.query(insertSql, [resourceParam, userId, body.group || null, grantedBy])
            return result.rows[0]
        })

        return res.status(201).send(newPermission)
    } catch (error: unknown) {
        if (error instanceof HttpError) throw error
        if ((error as { code?: string }).code === '23505') throw new HttpError(409, 'Permission already exists')
        throw error
    }
}

export async function handlePermissionGet(
    req: AuthenticatedRequest<{ Params: IdParams }>,
    res: FastifyReply,
    sqlPath: string
) {
    const sql = await loadSQL(sqlPath)
    const result = await run(sql, [req.params.id])
    return res.send(buildListResponse(result.rows as Record<string, unknown>[]))
}

type DeletePermissionConfig = {
    checkSqlPath: string
    ownerField: string
    deleteSqlPath: string
    parentIdParam: string
}

export async function handlePermissionDelete(
    req: AuthenticatedRequest<{ Params: Record<string, string> }>,
    res: FastifyReply,
    config: DeletePermissionConfig
) {
    const parentId = req.params[config.parentIdParam]
    if (!parentId) {
        throw new HttpError(400, `Missing ${config.parentIdParam}`)
    }

    await runInTransaction(async (client) => {
        const checkSql = await loadSQL(config.checkSqlPath)
        const checkResult = await client.query(checkSql, [req.params.id, parentId])

        if (checkResult.rows.length === 0) {
            throw new HttpError(404, 'Permission not found')
        }

        if (checkResult.rows[0][config.ownerField] !== req.user.id) {
            throw new HttpError(403, 'Forbidden')
        }

        const sql = await loadSQL(config.deleteSqlPath)
        await client.query(sql, [req.params.id, req.user.id])
    })
    return res.status(204).send()
}
