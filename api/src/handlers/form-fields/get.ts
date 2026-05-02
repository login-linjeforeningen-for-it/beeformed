import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { sendInternalServerError } from '#utils/http/errors.ts'
import type { AuthRequest } from '#utils/auth/authMiddleware.ts'

export default async function getFormFields(req: AuthRequest<'id'>) {
    const { id } = req.params
    if (!id) return Response.json({ error: 'id is required' }, { status: 400 })

    try {
        const sql = await loadSQL('form-fields/get.sql')
        const result = await run(sql, [id])
        return Response.json(result.rows)
    } catch (error) {
        return sendInternalServerError('Error reading entity:', error)
    }
}
