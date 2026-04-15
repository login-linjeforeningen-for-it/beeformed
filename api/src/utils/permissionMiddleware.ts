import type { FastifyReply, FastifyRequest } from 'fastify'
import { checkPermission } from '#utils/checkPermissions.ts'

export default async function permissionMiddleware(req: FastifyRequest, res: FastifyReply) {
    const params = req.params as { id?: string, formId?: string }
    const id = params.id || params.formId
    const userId = req.user?.id
    const userGroups = req.user?.groups || []

    if (!userId) {
        return res.status(401).send({ error: 'Unauthorized' })
    }

    if (!id) {
        return res.status(400).send({ error: 'Missing form ID' })
    }

    const hasPermission = await checkPermission(id, userId, userGroups)

    if (!hasPermission) {
        return res.status(403).send({ error: 'Forbidden' })
    }
}
