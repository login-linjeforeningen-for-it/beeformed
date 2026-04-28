import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { sendInternalServerError } from '#utils/http/errors.ts'
import type { AuthRequest } from '#utils/auth/authMiddleware.ts'

export default async function getSubmission(req: AuthRequest) {
    const queryParams: any = Object.fromEntries(new URL(req.url).searchParams.entries());

    const id = (req as any).params.id || (req as any).params.id;
    if (!id) return Response.json({ error: 'id is required' }, { status: 400 })
    const { formId } = queryParams as { formId?: string }
    const userId = req.user.id

    try {
        const sql = await loadSQL('submissions/get.sql')
        const result = await run(sql, [id, userId, formId || null])
        const entity = result.rows.length > 0 ? result.rows[0] : null
        
        if (!entity && formId) {
            return Response.json({ error: 'Submission not found or does not belong to this form' }, { status: 404 })
        }
        
        return Response.json(entity)
    } catch (error) {
        return sendInternalServerError('Error reading entity:', error)
    }
}