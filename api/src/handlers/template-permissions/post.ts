import type { FastifyReply, FastifyRequest } from 'fastify'
import { handlePermissionGrant } from '#utils/permissions/permissionGrants.ts'

export default async function createTemplatePermission(req: FastifyRequest, res: FastifyReply) {
    return handlePermissionGrant(req, res, {
        resourceTable: 'form_templates',
        resourceLabel: 'Template',
        requiredResourceIdMessage: 'template_id and granted_by are required',
        insertSQLPath: 'template-permissions/post.sql'
    })
}
