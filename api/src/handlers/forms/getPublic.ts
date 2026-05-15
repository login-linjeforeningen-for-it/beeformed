import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import checkToken from '#utils/auth/checkToken.ts'
import { logError } from '#utils/logger.ts'

export default async function getPublicForm(req: FastifyRequest<{ Params: IdParams }>, res: FastifyReply) {
    const id = req.params.id

    let userId: string | null = null
    const authHeaderRaw = req.headers['authorization']
    const authHeader = Array.isArray(authHeaderRaw) ? authHeaderRaw[0] : authHeaderRaw
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const tokenResult = await checkToken(req)
        if (tokenResult.errorCode === 'INTERNAL') {
            return res.status(500).send({ error: 'Internal server error' })
        }
        if (tokenResult.valid && tokenResult.userInfo) {
            userId = tokenResult.userInfo.sub
        }
    }

    try {
        const sql = await loadSQL('forms/getPublic.sql')
        const result = await run(sql, [id, userId])
        const entity = result.rows.length > 0 ? result.rows[0] : null

        if (!entity) {
            return res.status(404).send({ error: 'Form not found' })
        }

        return res.send(entity)
    } catch (error) {
        logError('Error reading entity', { event: 'http.internal_error', error })
        return res.status(500).send({ error: 'Internal server error' })
    }
}
