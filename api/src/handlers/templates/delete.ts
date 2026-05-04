import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { logError } from '#utils/logger.ts'
import { hasRequiredGroup } from '#utils/validation/validators.ts'
import type { AuthRequest } from '#utils/auth/authMiddleware.ts'

export default async function deleteTemplate(req: AuthRequest<'id'>) {
    const { id } = req.params
    if (!id) return Response.json({ error: 'id is required' }, { status: 400 })

    if (!hasRequiredGroup(req.user?.groups, 'QueenBee')) {
        return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
        const sql = await loadSQL('templates/delete.sql')
        const result = await run(sql, [id, req.user.id])

        if (result.rowCount === 0) {
            return Response.json({ error: 'Entity not found or permission denied' }, { status: 404 })
        }

        return new Response(null, { status: 204 })
    } catch (error) {
        logError('Error deleting entity', {
            event: 'http.internal_error',
            requestId: req.context?.requestId,
            error
        })
        return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
}
