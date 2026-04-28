import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import checkToken from '#utils/auth/checkToken.ts'
import { sendInternalServerError } from '#utils/http/errors.ts'

export default async function getPublicForm(req: Request) {
    const id = (req as any).params.id || (req as any).params.id;
    if (!id) return Response.json({ error: 'id is required' }, { status: 400 })

    let userId: string | null = null
    const authHeaderRaw = req.headers.get('authorization')
    const authHeader = Array.isArray(authHeaderRaw) ? authHeaderRaw[0] : authHeaderRaw
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        const tokenResult = await checkToken(req as Request)
        if (tokenResult.error === 'Internal server error') {
            return Response.json({ error: 'Internal server error' }, { status: 500 })
        }
        
        if (tokenResult.valid && tokenResult.userInfo) {
            userId = tokenResult.userInfo.sub
        }
    }

    try {
        const sql = await loadSQL('forms/getPublic.sql')
        const result = await run(sql, [id, userId])
        const entity = result.rows.length > 0 ? result.rows[0] : null
        return Response.json(entity)
    } catch (error) {
        return sendInternalServerError('Error reading entity:', error)
    }
}