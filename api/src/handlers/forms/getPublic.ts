import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import checkToken from '#utils/auth/checkToken.ts'
import { sendInternalServerError } from '#utils/http/errors.ts'
import { requireRouteParam } from '#utils/http/request.ts'

export default async function getPublicForm(req: FastifyRequest, res: FastifyReply) {
    const id = requireRouteParam(req, res, { error: 'id is required' })
    if (!id) return

    let userId: string | null = null
    const authHeaderRaw = req.headers['authorization']
    const authHeader = Array.isArray(authHeaderRaw) ? authHeaderRaw[0] : authHeaderRaw
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        const tokenResult = await checkToken(req, res)
        if (tokenResult.error === 'Internal server error') {
            return res.status(500).send({ error: 'Internal server error' })
        }
        if (res.sent) return
        if (tokenResult.valid && tokenResult.userInfo) {
            userId = tokenResult.userInfo.sub
        }
    }

    try {
        const sql = await loadSQL('forms/getPublic.sql')
        const result = await run(sql, [id, userId])
        const entity = result.rows.length > 0 ? result.rows[0] : null
        res.send(entity)
    } catch (error) {
        return sendInternalServerError(res, 'Error reading entity:', error)
    }
}