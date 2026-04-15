import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { logUtilityError } from '#utils/http/errors.ts'

type PermissionChecker = (entityId: string, userId: string, groups?: string[]) => Promise<boolean>

type PermissionMiddlewareOptions = {
    idParams: string[]
    missingIdMessage: string
    checkPermission: PermissionChecker
}

export function createPermissionChecker(sqlPath: string, errorContext: string): PermissionChecker {
    return async (entityId: string, userId: string, groups: string[] = []): Promise<boolean> => {
        try {
            const sql = await loadSQL(sqlPath)
            const result = await run(sql, [entityId, userId, groups])
            return result.rows[0]?.has_permission || false
        } catch (error) {
            logUtilityError(errorContext, error)
            return false
        }
    }
}

export function createPermissionMiddleware(options: PermissionMiddlewareOptions) {
    return async function permissionMiddleware(req: FastifyRequest, res: FastifyReply) {
        const params = req.params as Record<string, string | undefined>
        const id = options.idParams.map((key) => params[key]).find((value) => Boolean(value))
        const userId = req.user?.id
        const userGroups = req.user?.groups || []

        if (!userId) {
            res.status(401).send({ error: 'Unauthorized' })
            return
        }

        if (!id) {
            res.status(400).send({ error: options.missingIdMessage })
            return
        }

        const hasPermission = await options.checkPermission(id, userId, userGroups)

        if (!hasPermission) {
            res.status(403).send({ error: 'Forbidden' })
            return
        }
    }
}
