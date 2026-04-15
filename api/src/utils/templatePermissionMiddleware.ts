import type { FastifyReply, FastifyRequest } from 'fastify'
import { checkTemplatePermission } from '#utils/checkTemplatePermissions.ts'

export default async function templatePermissionMiddleware(req: FastifyRequest, res: FastifyReply) {
    const params = req.params as { id?: string, templateId?: string }
    const id = params.id || params.templateId
    const userId = req.user?.id
    const userGroups = req.user?.groups || []

    if (!userId) {
        return res.status(401).send({ error: 'Unauthorized' })
    }

    if (!id) {
        return res.status(400).send({ error: 'Missing template ID' })
    }

    const hasPermission = await checkTemplatePermission(parseInt(id), userId, userGroups)

    if (!hasPermission) {
        return res.status(403).send({ error: 'Forbidden' })
    }
}
