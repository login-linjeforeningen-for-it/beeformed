import type { FastifyInstance } from 'fastify'

import getIndex from './handlers/index/get.ts'
import getPing from './handlers/ping/get.ts'

import authMiddleware, {
    withAuthenticatedUser
} from './utils/auth/authMiddleware.ts'

import permissionMiddleware from './utils/permissions/permissionMiddleware.ts'
import templatePermissionMiddleware from './utils/permissions/templatePermissionMiddleware.ts'

import {
    createUser,
    getUser,
    deleteUser
} from './handlers/users/index.ts'

import {
    createForm,
    getForms,
    getSharedForms,
    getForm,
    getPublicForm,
    updateForm,
    deleteForm,
    duplicateForm
} from './handlers/forms/index.ts'

import {
    createTemplate,
    createTemplateFromForm,
    createFormFromTemplate,
    getTemplates,
    getSharedTemplates,
    getTemplate,
    updateTemplate,
    deleteTemplate
} from './handlers/templates/index.ts'

import {
    createFormPermission,
    getFormPermission,
    deleteFormPermission
} from './handlers/form-permissions/index.ts'

import {
    createTemplatePermission,
    getTemplatePermission,
    deleteTemplatePermission
} from './handlers/template-permissions/index.ts'

import {
    getFormFields,
    bulkFormFields
} from './handlers/form-fields/index.ts'

import {
    getTemplateFields,
    bulkTemplateFields
} from './handlers/template-fields/index.ts'

import {
    createSubmission,
    getSubmission,
    getSubmissionsByForm,
    getSubmissionsByUser,
    deleteSubmission,
    scanSubmission
} from './handlers/submissions/index.ts'

import getLiveCount from './handlers/submissions/getLiveCount.ts'

export default async function apiRoutes(
    fastify: FastifyInstance
) {
    // Index
    fastify.get('/', getIndex)

    // Ping
    fastify.get('/ping', getPing)

    // Users
    fastify.post(
        '/users', { preHandler: authMiddleware }, withAuthenticatedUser(createUser)
    )

    fastify.get(
        '/users', { preHandler: authMiddleware }, withAuthenticatedUser(getUser)
    )

    fastify.delete(
        '/users', { preHandler: authMiddleware }, withAuthenticatedUser(deleteUser)
    )

    // Forms
    fastify.post<{ Body: CreateOrUpdateFormBody }>(
        '/forms', { preHandler: authMiddleware }, withAuthenticatedUser(createForm)
    )

    fastify.get<{ Querystring: ListQuerystring }>(
        '/forms', { preHandler: authMiddleware }, withAuthenticatedUser(getForms)
    )

    fastify.get<{ Querystring: ListQuerystring }>(
        '/forms/shared', { preHandler: authMiddleware }, withAuthenticatedUser(getSharedForms)
    )

    fastify.get<{ Params: IdParams }>(
        '/forms/:id', { preHandler: [authMiddleware, permissionMiddleware] }, withAuthenticatedUser(getForm)
    )

    fastify.get<{ Params: IdParams }>(
        '/forms/:id/public', getPublicForm
    )

    fastify.put<{ Params: IdParams, Body: CreateOrUpdateFormBody }>(
        '/forms/:id', { preHandler: [authMiddleware, permissionMiddleware] }, withAuthenticatedUser(updateForm)
    )

    fastify.delete<{ Params: IdParams }>(
        '/forms/:id', { preHandler: [authMiddleware, permissionMiddleware] }, withAuthenticatedUser(deleteForm)
    )

    fastify.post<{ Params: IdParams }>(
        '/forms/:id/duplicate', { preHandler: [authMiddleware, permissionMiddleware] }, withAuthenticatedUser(duplicateForm)
    )

    fastify.post<{ Params: IdParams }>(
        '/forms/:id/templates', { preHandler: [authMiddleware, permissionMiddleware] }, withAuthenticatedUser(createTemplateFromForm)
    )

    // Templates
    fastify.post<{ Body: CreateTemplateBody }>(
        '/templates', { preHandler: authMiddleware }, withAuthenticatedUser(createTemplate)
    )

    fastify.get<{ Querystring: ListQuerystring }>(
        '/templates', { preHandler: authMiddleware }, withAuthenticatedUser(getTemplates)
    )

    fastify.get<{ Querystring: ListQuerystring }>(
        '/templates/shared', { preHandler: authMiddleware }, withAuthenticatedUser(getSharedTemplates)
    )

    fastify.get<{ Params: IdParams }>(
        '/templates/:id', { preHandler: [authMiddleware, templatePermissionMiddleware] }, withAuthenticatedUser(getTemplate)
    )

    fastify.put<{ Params: IdParams, Body: UpdateTemplateBody }>(
        '/templates/:id', { preHandler: [authMiddleware, templatePermissionMiddleware] }, withAuthenticatedUser(updateTemplate)
    )

    fastify.delete<{ Params: IdParams }>(
        '/templates/:id', { preHandler: [authMiddleware, templatePermissionMiddleware] }, withAuthenticatedUser(deleteTemplate)
    )

    fastify.post<{ Params: IdParams }>(
        '/templates/:id/duplicate', { preHandler: [authMiddleware, templatePermissionMiddleware] }, withAuthenticatedUser(createFormFromTemplate)
    )

    // Form Permissions
    fastify.get<{ Params: IdParams }>(
        '/forms/:id/permissions', { preHandler: [authMiddleware, permissionMiddleware] }, withAuthenticatedUser(getFormPermission)
    )

    fastify.post<{ Params: IdParams, Body: PermissionGrantBody }>(
        '/forms/:id/permissions', { preHandler: [authMiddleware, permissionMiddleware] }, withAuthenticatedUser(createFormPermission)
    )

    fastify.delete<{ Params: FormIdAndIdParams }>(
        '/forms/:formId/permissions/:id', { preHandler: [authMiddleware, permissionMiddleware] }, withAuthenticatedUser(deleteFormPermission)
    )

    // Template Permissions
    fastify.get<{ Params: IdParams }>(
        '/templates/:id/permissions', { preHandler: [authMiddleware, templatePermissionMiddleware] }, withAuthenticatedUser(getTemplatePermission)
    )

    fastify.post<{ Params: IdParams, Body: PermissionGrantBody }>(
        '/templates/:id/permissions', { preHandler: [authMiddleware, templatePermissionMiddleware] }, withAuthenticatedUser(createTemplatePermission)
    )

    fastify.delete<{ Params: TemplateIdAndIdParams }>(
        '/templates/:templateId/permissions/:id', { preHandler: [authMiddleware, templatePermissionMiddleware] }, withAuthenticatedUser(deleteTemplatePermission)
    )

    // Form Fields
    fastify.get<{ Params: IdParams }>(
        '/forms/:id/fields', { preHandler: [authMiddleware, permissionMiddleware] }, withAuthenticatedUser(getFormFields)
    )

    fastify.patch<{ Params: IdParams, Body: BulkFormFieldOperation[] }>(
        '/forms/:id/fields', { preHandler: [authMiddleware, permissionMiddleware] }, withAuthenticatedUser(bulkFormFields)
    )

    // Template Fields
    fastify.get<{ Params: IdParams }>(
        '/templates/:id/fields', { preHandler: [authMiddleware, templatePermissionMiddleware] }, withAuthenticatedUser(getTemplateFields)
    )

    fastify.patch<{ Params: IdParams, Body: BulkTemplateFieldOperation[] }>(
        '/templates/:id/fields', { preHandler: [authMiddleware, templatePermissionMiddleware] }, withAuthenticatedUser(bulkTemplateFields)
    )

    // Live
    fastify.get<{ Params: IdParams }>(
        '/forms/:id/live', getLiveCount
    )

    // Submissions
    fastify.get<{ Params: IdParams, Querystring: SubmissionsByFormQuerystring }>(
        '/forms/:id/submissions', { preHandler: [authMiddleware, permissionMiddleware] }, withAuthenticatedUser(getSubmissionsByForm)
    )

    fastify.post<{ Params: IdParams, Body: CreateSubmissionBody }>(
        '/forms/:id/submissions', { preHandler: authMiddleware }, withAuthenticatedUser(createSubmission)
    )

    fastify.get<{ Params: IdParams, Querystring: SubmissionByIdQuerystring }>(
        '/submissions/:id', { preHandler: authMiddleware }, withAuthenticatedUser(getSubmission)
    )

    fastify.post<{ Params: IdParams, Body: ScanSubmissionBody }>(
        '/submissions/:id/scan', { preHandler: authMiddleware }, withAuthenticatedUser(scanSubmission)
    )

    fastify.get<{ Querystring: ListQuerystring }>(
        '/submissions', { preHandler: authMiddleware }, withAuthenticatedUser(getSubmissionsByUser)
    )

    fastify.delete<{ Params: IdParams }>(
        '/submissions/:id', { preHandler: authMiddleware }, withAuthenticatedUser(deleteSubmission)
    )
}
