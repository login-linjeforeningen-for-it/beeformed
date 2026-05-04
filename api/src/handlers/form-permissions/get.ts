import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { logError } from '#utils/logger.ts'

import type { AuthRequest } from '#utils/auth/authMiddleware.ts'

export default async function getFormPermissions(req: AuthRequest<'id'>) {
    const { id } = req.params
    if (!id) return Response.json({ error: 'id is required' }, { status: 400 })

    try {
        const sql = await loadSQL('form-permissions/get.sql')
        const result = await run(sql, [id])
        return Response.json({ data: result.rows, total: result.rows.length })
    } catch (error) {
        logError('Error reading entity', {
            event: 'http.internal_error',
            requestId: req.context?.requestId,
            error
        })
        return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
}
