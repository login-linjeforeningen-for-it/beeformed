import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { logError } from '#utils/logger.ts'
import type { AuthRequest } from '#utils/auth/authMiddleware.ts'

export default async function createUser(req: AuthRequest) {
    const user_id = req.user.id
    const email = req.user.email
    const name = req.user.name

    if (!user_id || !email || !name) {
        return Response.json({ error: 'user_id, email, and name are required' }, { status: 400 })
    }

    try {
        const sql = await loadSQL('users/post.sql')
        const result = await run(sql, [user_id, email, name])
        return Response.json(result.rows[0], { status: 201 })
    } catch (error) {
        logError('Error creating entity', {
            event: 'http.internal_error',
            requestId: req.context?.requestId,
            error
        })
        return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
}
