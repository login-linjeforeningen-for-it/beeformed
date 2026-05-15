import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { logError } from '#utils/logger.ts'

export default async function deleteTemplatePermission(req: AuthenticatedRequest<{ Params: TemplateIdAndIdParams }>, res: FastifyReply) {
    try {
        const checkResult = await run(
            `SELECT tp.id, ft.user_id AS template_owner_id
             FROM template_permissions tp
             JOIN form_templates ft ON tp.template_id = ft.id
             WHERE tp.id = $1`,
            [req.params.id]
        )

        if (checkResult.rows.length === 0) {
            return res.status(404).send({ error: 'Permission not found' })
        }

        if (checkResult.rows[0].template_owner_id !== req.user.id) {
            return res.status(403).send({ error: 'Forbidden' })
        }

        const sql = await loadSQL('template-permissions/delete.sql')
        await run(sql, [req.params.id, req.user.id])

        return res.status(204).send()
    } catch (error) {
        logError('Error deleting entity', {
            event: 'http.internal_error',
            requestId: req.id,
            error
        })
        return res.status(500).send({ error: 'Internal server error' })
    }
}
