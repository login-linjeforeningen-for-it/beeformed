import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { sendInternalServerError } from '#utils/http/errors.ts'
import type { AuthRequest } from '#utils/auth/authMiddleware.ts'

export default async function deleteFormPermission(req: AuthRequest<'id'>) {
    const { id } = req.params
    if (!id) return Response.json({ error: 'id is required' }, { status: 400 })

    try {
        const sql = await loadSQL('form-permissions/delete.sql')
        const result = await run(sql, [id, req.user.id])

        if (result.rowCount === 0) {
            return Response.json({ error: 'Entity not found or permission denied' }, { status: 404 })
        }

        return new Response(null, { status: 204 })
    } catch (error) {
        return sendInternalServerError('Error deleting entity:', error)
    }
}