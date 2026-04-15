import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { sendInternalServerError } from '#utils/http/errors.ts'

export default async function createUser(req: FastifyRequest, res: FastifyReply) {
    const user_id = req.user!.id
    const email = req.user!.email
    const name = req.user!.name

    if (!user_id || !email || !name) {
        return res.status(400).send({ error: 'user_id, email, and name are required' })
    }

    try {
        const sql = await loadSQL('users/post.sql')
        const result = await run(sql, [user_id, email, name])
        res.status(201).send(result.rows[0])
    } catch (error) {
        return sendInternalServerError(res, 'Error creating entity:', error)
    }
}
