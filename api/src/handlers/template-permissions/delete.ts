import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { sendInternalServerError } from '#utils/http/errors.ts'
import type { AuthRequest } from '#utils/auth/authMiddleware.ts'

export default async function deleteTemplatePermission(req: AuthRequest) {
    const id = (req as any).params.id || (req as any).params.id;
    if (!id) return Response.json({ error: 'id is required' }, { status: 400 })

    try {
        const sql = await loadSQL('template-permissions/delete.sql')
        const result = await run(sql, [id, req.user.id])

        if (result.rowCount === 0) {
            return Response.json({ error: 'Entity not found or permission denied' }, { status: 404 })
        }

        return new Response(null, { status: 204 })
    } catch (error) {
        return sendInternalServerError('Error deleting entity:', error)
    }
}
