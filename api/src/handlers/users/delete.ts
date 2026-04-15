import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { sendInternalServerError } from '#utils/http/errors.ts'

export default async function deleteUser(req: FastifyRequest, res: FastifyReply) {
    const id = req.user!.id

    if (!id) {
        return res.status(400).send({ error: 'id is required' })
    }

    try {
        const sql = await loadSQL('users/delete.sql')
        await run(sql, [id])
        res.status(204).send()
    } catch (error) {
        return sendInternalServerError(res, 'Error deleting entity:', error)
    }
}