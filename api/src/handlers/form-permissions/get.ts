import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { sendInternalServerError } from '#utils/http/errors.ts'

export default async function getFormPermissions(req: Request) {
    const id = (req as any).params.id || (req as any).params.id;
    if (!id) return Response.json({ error: 'id is required' }, { status: 400 })

    try {
        const sql = await loadSQL('form-permissions/get.sql')
        const result = await run(sql, [id])
        return Response.json({ data: result.rows, total: result.rows.length })
    } catch (error) {
        return sendInternalServerError('Error reading entity:', error)
    }
}
