import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { sendInternalServerError } from '#utils/http/errors.ts'
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
        return sendInternalServerError('Error deleting entity:', error)
    }
}