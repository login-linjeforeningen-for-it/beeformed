import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { logUtilityError } from '#utils/http/errors.ts'
import type { AuthRequest } from '#utils/auth/authMiddleware.ts'

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
    return function withPermission<T extends string = string>(handler: (req: AuthRequest<T>) => Response | Promise<Response>) {
        return async (req: AuthRequest<T>): Promise<Response> => {
            const params = req.params as Record<string, string | undefined>
            const id = options.idParams.map((key) => params[key]).find((value) => Boolean(value))
            const userId = req.user?.id
            const userGroups = req.user?.groups || []

            if (!id) {
                return Response.json({ error: options.missingIdMessage }, { status: 400 })
            }

            const hasPermission = await options.checkPermission(id, userId, userGroups)

            if (!hasPermission) {
                return Response.json({ error: 'Forbidden' }, { status: 403 })
            }

            return handler(req)
        }
    }
}
