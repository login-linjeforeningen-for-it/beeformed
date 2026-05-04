import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { logError } from '#utils/logger.ts'
import type { AuthRequest } from '#utils/auth/authMiddleware.ts'

export default async function deleteUser(req: AuthRequest) {
    const id = req.user.id

    if (!id) {
        return Response.json({ error: 'id is required' }, { status: 400 })
    }

    try {
        const sql = await loadSQL('users/delete.sql')
        await run(sql, [id])
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