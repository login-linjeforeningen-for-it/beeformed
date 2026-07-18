// Schemas
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
    createOrUpdateFormBodySchema,
    createTemplateFromFormBodySchema,
    duplicateFormBodySchema,
    createTemplateBodySchema,
    slugOrIdParamsSchema,
    updateTemplateBodySchema,
    toFormBodySchema,
    permissionGrantBodySchema,
    createSubmissionBodySchema,
    scanParamsSchema,
    bulkFormFieldBodySchema,
    bulkTemplateFieldBodySchema,
    idParamsSchema,
    formIdAndIdParamsSchema,
    templateIdAndIdParamsSchema,
    listQuerystringSchema,
    submissionsByFormQuerystringSchema,
    submissionByIdQuerystringSchema
} from './schemas.ts'

// Middleware
import authMiddleware from './utils/auth/authMiddleware.ts'
import optionalAuthMiddleware from './utils/auth/optionalAuthMiddleware.ts'
import { requireGroup } from './utils/auth/requireGroup.ts'

import {
    formPermissionMiddleware,
    templatePermissionMiddleware
} from './utils/auth/permissions/middleware.ts'

// Handlers
import getIndex from './handlers/index/get.ts'

import getPing from './handlers/ping/get.ts'

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

export default async function apiRoutes(instance: FastifyInstance) {
    const fastify = instance.withTypeProvider<ZodTypeProvider>()

    // Index
    fastify.get('/', { onRequest: optionalAuthMiddleware }, getIndex)

    // Ping
    fastify.get('/ping', getPing)

    // Users
    fastify.post('/users', { onRequest: authMiddleware }, createUser)
    fastify.get('/users', { onRequest: authMiddleware }, getUser)
    fastify.delete('/users', { onRequest: authMiddleware }, deleteUser)

    // Forms
    fastify.post('/forms',
        { onRequest: [authMiddleware, requireGroup('Aktiv')], schema: { body: createOrUpdateFormBodySchema } },
        createForm
    )
    fastify.get('/forms',
        { onRequest: authMiddleware, schema: { querystring: listQuerystringSchema } },
        listForms
    )
    fastify.get('/forms/shared',
        { onRequest: authMiddleware, schema: { querystring: listQuerystringSchema } },
        listSharedForms
    )
    fastify.get('/forms/:id',
        { onRequest: authMiddleware, preValidation: formPermissionMiddleware, schema: { params: idParamsSchema } },
        getForm
    )
    fastify.get('/forms/:id/public',
        { onRequest: optionalAuthMiddleware, schema: { params: slugOrIdParamsSchema } },
        getPublicForm
    )
    fastify.put('/forms/:id',
        {
            onRequest: [authMiddleware, requireGroup('Aktiv')],
            preValidation: formPermissionMiddleware,
            schema: { params: idParamsSchema, body: createOrUpdateFormBodySchema },
        },
        updateForm
    )
    fastify.delete('/forms/:id',
        {
            onRequest: [authMiddleware, requireGroup('Aktiv')],
            preValidation: formPermissionMiddleware,
            schema: { params: idParamsSchema },
        },
        deleteForm
    )
    fastify.post('/forms/:id/duplicate',
        {
            onRequest: [authMiddleware, requireGroup('Aktiv')],
            preValidation: formPermissionMiddleware,
            schema: { params: idParamsSchema, body: duplicateFormBodySchema },
        },
        duplicateForm
    )
    fastify.post('/forms/:id/templates',
        {
            onRequest: [authMiddleware, requireGroup('Aktiv')],
            preValidation: formPermissionMiddleware,
            schema: { params: idParamsSchema, body: createTemplateFromFormBodySchema },
        },
        createTemplateFromForm
    )

    // Templates
    fastify.post('/templates',
        { onRequest: [authMiddleware, requireGroup('Aktiv')], schema: { body: createTemplateBodySchema } },
        createTemplate
    )
    fastify.get('/templates',
        { onRequest: authMiddleware, schema: { querystring: listQuerystringSchema } },
        listTemplates
    )
    fastify.get('/templates/shared',
        { onRequest: authMiddleware, schema: { querystring: listQuerystringSchema } },
        listSharedTemplates
    )
    fastify.get('/templates/:id',
        { onRequest: authMiddleware, preValidation: templatePermissionMiddleware, schema: { params: idParamsSchema } },
        getTemplate
    )
    fastify.put('/templates/:id',
        {
            onRequest: [authMiddleware, requireGroup('Aktiv')],
            preValidation: templatePermissionMiddleware,
            schema: { params: idParamsSchema, body: updateTemplateBodySchema },
        },
        updateTemplate
    )
    fastify.delete('/templates/:id',
        {
            onRequest: [authMiddleware, requireGroup('Aktiv')],
            preValidation: templatePermissionMiddleware,
            schema: { params: idParamsSchema },
        },
        deleteTemplate
    )
    fastify.post('/templates/:id/form',
        {
            onRequest: [authMiddleware, requireGroup('Aktiv')],
            preValidation: templatePermissionMiddleware,
            schema: { params: idParamsSchema, body: toFormBodySchema },
        },
        createFormFromTemplate
    )

    // Form Permissions
    fastify.get('/forms/:id/permissions',
        { onRequest: authMiddleware, preValidation: formPermissionMiddleware, schema: { params: idParamsSchema } },
        listFormPermissions
    )
    fastify.post('/forms/:id/permissions',
        {
            onRequest: authMiddleware,
            preValidation: formPermissionMiddleware,
            schema: { params: idParamsSchema, body: permissionGrantBodySchema },
        },
        createFormPermission
    )
    fastify.delete('/forms/:formId/permissions/:id',
        { onRequest: authMiddleware, preValidation: formPermissionMiddleware, schema: { params: formIdAndIdParamsSchema } },
        deleteFormPermission
    )

    // Template Permissions
    fastify.get('/templates/:id/permissions',
        { onRequest: authMiddleware, preValidation: templatePermissionMiddleware, schema: { params: idParamsSchema } },
        listTemplatePermissions
    )
    fastify.post('/templates/:id/permissions',
        {
            onRequest: authMiddleware,
            preValidation: templatePermissionMiddleware,
            schema: { params: idParamsSchema, body: permissionGrantBodySchema },
        },
        createTemplatePermission
    )
    fastify.delete('/templates/:templateId/permissions/:id',
        { onRequest: authMiddleware, preValidation: templatePermissionMiddleware, schema: { params: templateIdAndIdParamsSchema } },
        deleteTemplatePermission
    )

    // Form Fields
    fastify.get('/forms/:id/fields',
        { onRequest: authMiddleware, preValidation: formPermissionMiddleware, schema: { params: idParamsSchema } },
        listFormFields
    )
    fastify.patch('/forms/:id/fields',
        {
            onRequest: authMiddleware,
            preValidation: [requireGroup('Aktiv'), formPermissionMiddleware],
            schema: { params: idParamsSchema, body: bulkFormFieldBodySchema },
        },
        syncFormFields
    )

    // Template Fields
    fastify.get('/templates/:id/fields',
        { onRequest: authMiddleware, preValidation: templatePermissionMiddleware, schema: { params: idParamsSchema } },
        listTemplateFields
    )
    fastify.patch('/templates/:id/fields',
        {
            onRequest: authMiddleware,
            preValidation: [requireGroup('Aktiv'), templatePermissionMiddleware],
            schema: { params: idParamsSchema, body: bulkTemplateFieldBodySchema },
        },
        syncTemplateFields
    )

    // Live
    fastify.get('/forms/:id/live',
        { schema: { params: idParamsSchema } },
        getLiveCount
    )

    // Submissions
    fastify.get('/forms/:id/submissions',
        {
            onRequest: authMiddleware,
            preValidation: formPermissionMiddleware,
            schema: { params: idParamsSchema, querystring: submissionsByFormQuerystringSchema },
        },
        listSubmissionsByForm
    )
    fastify.post('/forms/:id/submissions',
        { onRequest: authMiddleware, schema: { params: idParamsSchema, body: createSubmissionBodySchema } },
        createSubmission
    )
    fastify.get('/submissions/:id',
        { onRequest: authMiddleware, schema: { params: idParamsSchema, querystring: submissionByIdQuerystringSchema } },
        getSubmission
    )
    fastify.post('/forms/:id/scan/:submissionId',
        { onRequest: authMiddleware, preValidation: formPermissionMiddleware, schema: { params: scanParamsSchema } },
        scanSubmission
    )
    fastify.get('/submissions',
        { onRequest: authMiddleware, schema: { querystring: listQuerystringSchema } },
        listSubmissionsByUser
    )
    fastify.delete('/submissions/:id',
        { onRequest: authMiddleware, schema: { params: idParamsSchema } },
        deleteSubmission
    )
}
