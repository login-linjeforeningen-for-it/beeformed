import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { sendInternalServerError } from '#utils/http/errors.ts'

export default async function getUser(req: FastifyRequest, res: FastifyReply) {
    const id = req.user!.id

    if (!id) {
        return res.status(400).send({ error: 'id is required' })
    }

    try {
        const sql = await loadSQL('users/get.sql')
        const result = await run(sql, [id])
        const entity = result.rows.length > 0 ? result.rows[0] : null
        res.send(entity)
    } catch (error) {
        return sendInternalServerError(res, 'Error reading entity:', error)
    }
}
