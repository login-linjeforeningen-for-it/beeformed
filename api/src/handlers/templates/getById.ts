import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { sendInternalServerError } from '#utils/http/errors.ts'

export default async function getOneTemplate(req: Request) {
    const id = (req as any).params.id || (req as any).params.id;
    if (!id) return Response.json({ error: 'id is required' }, { status: 400 })

    try {
        const sql = await loadSQL('templates/get.sql')
        const result = await run(sql, [id])
        const entity = result.rows.length > 0 ? result.rows[0] : null
        return Response.json(entity)
    } catch (error) {
        return sendInternalServerError('Error reading entity:', error)
    }
}
