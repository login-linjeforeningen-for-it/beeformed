import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import type { AuthRequest } from '#utils/auth/authMiddleware.ts'

export default async function getLiveCount(req: AuthRequest<'id'>) {
    const { id: formId } = req.params

    const sql = await loadSQL('submissions/liveCount.sql')
    const result = await run(sql, [formId])

    if (result.rows.length === 0) {
        return Response.json({ error: 'Form not found' }, { status: 404 })
    }

    const row = result.rows[0] as { registered_count: number; limit: number | null }
    const spaces_left = row.limit !== null ? Math.max(0, row.limit - row.registered_count) : null

    return Response.json({
        registered_count: row.registered_count,
        limit: row.limit,
        spaces_left,
    })
}
