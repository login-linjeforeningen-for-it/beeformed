import type { FastifyReply, FastifyRequest } from 'fastify'
import { handlePermissionGrant } from '#utils/permissions/permissionGrants.ts'

export default async function createFormPermission(req: FastifyRequest, res: FastifyReply) {
    return handlePermissionGrant(req, res, {
        resourceTable: 'forms',
        resourceLabel: 'Form',
        requiredResourceIdMessage: 'form_id and granted_by are required',
        insertSQLPath: 'form-permissions/post.sql'
    })
}
