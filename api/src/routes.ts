import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
    createOrUpdateFormBodySchema,
    createTemplateBodySchema,
    updateTemplateBodySchema,
    permissionGrantBodySchema,
    createSubmissionBodySchema,
    scanSubmissionBodySchema,
    bulkFormFieldBodySchema,
    bulkTemplateFieldBodySchema,
    idParamsSchema,
    formIdAndIdParamsSchema,
    templateIdAndIdParamsSchema,
    listQuerystringSchema,
    submissionsByFormQuerystringSchema,
    submissionByIdQuerystringSchema
} from './schemas.ts'

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
    listForms,
    listSharedForms,
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
    listTemplates,
    listSharedTemplates,
    getTemplate,
    updateTemplate,
    deleteTemplate
} from './handlers/templates/index.ts'

import {
    createFormPermission,
    listFormPermissions,
    deleteFormPermission
} from './handlers/form-permissions/index.ts'

import {
    createTemplatePermission,
    listTemplatePermissions,
    deleteTemplatePermission
} from './handlers/template-permissions/index.ts'

import {
    listFormFields,
    syncFormFields
} from './handlers/form-fields/index.ts'

import {
    listTemplateFields,
    syncTemplateFields
} from './handlers/template-fields/index.ts'

import {
    createSubmission,
    getSubmission,
    listSubmissionsByForm,
    listSubmissionsByUser,
    deleteSubmission,
    scanSubmission,
    getLiveCount
} from './handlers/submissions/index.ts'

export default async function apiRoutes(
    instance: FastifyInstance
) {
    const fastify = instance.withTypeProvider<ZodTypeProvider>()

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
    fastify.post(
        '/forms',
        { preHandler: authMiddleware, schema: { body: createOrUpdateFormBodySchema } },
        withAuthenticatedUser(createForm)
    )

    fastify.get(
        '/forms',
        { preHandler: authMiddleware, schema: { querystring: listQuerystringSchema } },
        withAuthenticatedUser(listForms)
    )

    fastify.get(
        '/forms/shared',
        { preHandler: authMiddleware, schema: { querystring: listQuerystringSchema } },
        withAuthenticatedUser(listSharedForms)
    )

    fastify.get(
        '/forms/:id',
        { preHandler: [authMiddleware, permissionMiddleware], schema: { params: idParamsSchema } },
        withAuthenticatedUser(getForm)
    )

    fastify.get(
        '/forms/:id/public',
        { schema: { params: idParamsSchema } },
        getPublicForm
    )

    fastify.put(
        '/forms/:id',
        { preHandler: [authMiddleware, permissionMiddleware], schema: { params: idParamsSchema, body: createOrUpdateFormBodySchema } },
        withAuthenticatedUser(updateForm)
    )

    fastify.delete(
        '/forms/:id',
        { preHandler: [authMiddleware, permissionMiddleware], schema: { params: idParamsSchema } },
        withAuthenticatedUser(deleteForm)
    )

    fastify.post(
        '/forms/:id/duplicate',
        { preHandler: [authMiddleware, permissionMiddleware], schema: { params: idParamsSchema } },
        withAuthenticatedUser(duplicateForm)
    )

    fastify.post(
        '/forms/:id/templates',
        { preHandler: [authMiddleware, permissionMiddleware], schema: { params: idParamsSchema } },
        withAuthenticatedUser(createTemplateFromForm)
    )

    // Templates
    fastify.post(
        '/templates',
        { preHandler: authMiddleware, schema: { body: createTemplateBodySchema } },
        withAuthenticatedUser(createTemplate)
    )

    fastify.get(
        '/templates',
        { preHandler: authMiddleware, schema: { querystring: listQuerystringSchema } },
        withAuthenticatedUser(listTemplates)
    )

    fastify.get(
        '/templates/shared',
        { preHandler: authMiddleware, schema: { querystring: listQuerystringSchema } },
        withAuthenticatedUser(listSharedTemplates)
    )

    fastify.get(
        '/templates/:id',
        { preHandler: [authMiddleware, templatePermissionMiddleware], schema: { params: idParamsSchema } },
        withAuthenticatedUser(getTemplate)
    )

    fastify.put(
        '/templates/:id',
        { preHandler: [authMiddleware, templatePermissionMiddleware], schema: { params: idParamsSchema, body: updateTemplateBodySchema } },
        withAuthenticatedUser(updateTemplate)
    )

    fastify.delete(
        '/templates/:id',
        { preHandler: [authMiddleware, templatePermissionMiddleware], schema: { params: idParamsSchema } },
        withAuthenticatedUser(deleteTemplate)
    )

    fastify.post(
        '/templates/:id/duplicate',
        { preHandler: [authMiddleware, templatePermissionMiddleware], schema: { params: idParamsSchema } },
        withAuthenticatedUser(createFormFromTemplate)
    )

    // Form Permissions
    fastify.get(
        '/forms/:id/permissions',
        { preHandler: [authMiddleware, permissionMiddleware], schema: { params: idParamsSchema } },
        withAuthenticatedUser(listFormPermissions)
    )

    fastify.post(
        '/forms/:id/permissions',
        { preHandler: [authMiddleware, permissionMiddleware], schema: { params: idParamsSchema, body: permissionGrantBodySchema } },
        withAuthenticatedUser(createFormPermission)
    )

    fastify.delete(
        '/forms/:formId/permissions/:id',
        { preHandler: [authMiddleware, permissionMiddleware], schema: { params: formIdAndIdParamsSchema } },
        withAuthenticatedUser(deleteFormPermission)
    )

    // Template Permissions
    fastify.get(
        '/templates/:id/permissions',
        { preHandler: [authMiddleware, templatePermissionMiddleware], schema: { params: idParamsSchema } },
        withAuthenticatedUser(listTemplatePermissions)
    )

    fastify.post(
        '/templates/:id/permissions',
        { preHandler: [authMiddleware, templatePermissionMiddleware], schema: { params: idParamsSchema, body: permissionGrantBodySchema } },
        withAuthenticatedUser(createTemplatePermission)
    )

    fastify.delete(
        '/templates/:templateId/permissions/:id',
        { preHandler: [authMiddleware, templatePermissionMiddleware], schema: { params: templateIdAndIdParamsSchema } },
        withAuthenticatedUser(deleteTemplatePermission)
    )

    // Form Fields
    fastify.get(
        '/forms/:id/fields',
        { preHandler: [authMiddleware, permissionMiddleware], schema: { params: idParamsSchema } },
        withAuthenticatedUser(listFormFields)
    )

    fastify.patch(
        '/forms/:id/fields',
        { preHandler: [authMiddleware, permissionMiddleware], schema: { params: idParamsSchema, body: bulkFormFieldBodySchema } },
        withAuthenticatedUser(syncFormFields)
    )

    // Template Fields
    fastify.get(
        '/templates/:id/fields',
        { preHandler: [authMiddleware, templatePermissionMiddleware], schema: { params: idParamsSchema } },
        withAuthenticatedUser(listTemplateFields)
    )

    fastify.patch(
        '/templates/:id/fields',
        { preHandler: [authMiddleware, templatePermissionMiddleware], schema: { params: idParamsSchema, body: bulkTemplateFieldBodySchema } },
        withAuthenticatedUser(syncTemplateFields)
    )

    // Live
    fastify.get(
        '/forms/:id/live',
        { schema: { params: idParamsSchema } },
        getLiveCount
    )

    // Submissions
    fastify.get(
        '/forms/:id/submissions',
        { preHandler: [authMiddleware, permissionMiddleware], schema: { params: idParamsSchema, querystring: submissionsByFormQuerystringSchema } },
        withAuthenticatedUser(listSubmissionsByForm)
    )

    fastify.post(
        '/forms/:id/submissions',
        { preHandler: authMiddleware, schema: { params: idParamsSchema, body: createSubmissionBodySchema } },
        withAuthenticatedUser(createSubmission)
    )

    fastify.get(
        '/submissions/:id',
        { preHandler: authMiddleware, schema: { params: idParamsSchema, querystring: submissionByIdQuerystringSchema } },
        withAuthenticatedUser(getSubmission)
    )

    fastify.post(
        '/submissions/:id/scan',
        { preHandler: authMiddleware, schema: { params: idParamsSchema, body: scanSubmissionBodySchema } },
        withAuthenticatedUser(scanSubmission)
    )

    fastify.get(
        '/submissions',
        { preHandler: authMiddleware, schema: { querystring: listQuerystringSchema } },
        withAuthenticatedUser(listSubmissionsByUser)
    )

    fastify.delete(
        '/submissions/:id',
        { preHandler: authMiddleware, schema: { params: idParamsSchema } },
        withAuthenticatedUser(deleteSubmission)
    )
}
