import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { sendInternalServerError } from '#utils/http/errors.ts'
import { hasRequiredGroup } from '#utils/validation/validators.ts'
import type { AuthRequest } from '#utils/auth/authMiddleware.ts'

export default async function deleteForm(req: AuthRequest) {
    const id = (req as any).params.id || (req as any).params.id;
    if (!id) return Response.json({ error: 'id is required' }, { status: 400 })

    if (!hasRequiredGroup(req.user?.groups, 'Aktiv')) {
        return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
        const sql = await loadSQL('forms/delete.sql')
        const result = await run(sql, [id, req.user.id])

        if (result.rowCount === 0) {
            return Response.json({ error: 'Entity not found or permission denied' }, { status: 404 })
        }

        return new Response(null, { status: 204 })
    } catch (error) {
        return sendInternalServerError('Error deleting entity:', error)
    }
}