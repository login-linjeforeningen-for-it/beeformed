import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { sendInternalServerError } from '#utils/http/errors.ts'
import type { AuthRequest } from '#utils/auth/authMiddleware.ts'

export default async function getUser(req: AuthRequest) {
    const id = req.user.id

    if (!id) {
        return Response.json({ error: 'id is required' }, { status: 400 })
    }

    try {
        const sql = await loadSQL('users/get.sql')
        const result = await run(sql, [id])
        const entity = result.rows.length > 0 ? result.rows[0] : null
        return Response.json(entity)
    } catch (error) {
        return sendInternalServerError('Error reading entity:', error)
    }
}
