import type { FastifyInstance } from 'fastify'

import getIndex from './handlers/index/getIndex.ts'
import getPing from './handlers/ping/get.ts'

import authMiddleware from './utils/authMiddleware.ts'
import permissionMiddleware from './utils/permissionMiddleware.ts'
import templatePermissionMiddleware from './utils/templatePermissionMiddleware.ts'

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
import liveCountHandler from './handlers/submissions/liveCount.ts'

export default async function apiRoutes(fastify: FastifyInstance) {
    // index
    fastify.get('/', getIndex)

    // ping
    fastify.get('/ping', getPing)

    // Users
    fastify.post('/users', { preHandler: authMiddleware }, createUser)
    fastify.get('/users', { preHandler: authMiddleware }, getUser)
    fastify.delete('/users', { preHandler: authMiddleware }, deleteUser)

    // Forms
    fastify.post('/forms', { preHandler: authMiddleware }, createForm)
    fastify.get('/forms', { preHandler: authMiddleware }, getForms)
    fastify.get('/forms/shared', { preHandler: authMiddleware }, getSharedForms)
    fastify.get('/forms/:id', { preHandler: [authMiddleware, permissionMiddleware] }, getForm)
    fastify.get('/forms/:id/public', getPublicForm)
    fastify.put('/forms/:id', { preHandler: [authMiddleware, permissionMiddleware] }, updateForm)
    fastify.delete('/forms/:id', { preHandler: [authMiddleware, permissionMiddleware] }, deleteForm)
    fastify.post('/forms/:id/duplicate', { preHandler: [authMiddleware, permissionMiddleware] }, duplicateForm)
    fastify.post('/forms/:id/templates', { preHandler: [authMiddleware, permissionMiddleware] }, createTemplateFromForm)

    // Templates
    fastify.post('/templates', { preHandler: authMiddleware }, createTemplate)
    fastify.get('/templates', { preHandler: authMiddleware }, getTemplates)
    fastify.get('/templates/shared', { preHandler: authMiddleware }, getSharedTemplates)
    fastify.get('/templates/:id', { preHandler: [authMiddleware, templatePermissionMiddleware] }, getTemplate)
    fastify.put('/templates/:id', { preHandler: [authMiddleware, templatePermissionMiddleware] }, updateTemplate)
    fastify.delete('/templates/:id', { preHandler: [authMiddleware, templatePermissionMiddleware] }, deleteTemplate)
    fastify.post('/templates/:id/duplicate', { preHandler: [authMiddleware, templatePermissionMiddleware] }, createFormFromTemplate)

    // Form Permissions
    fastify.get('/forms/:id/permissions', { preHandler: [authMiddleware, permissionMiddleware] }, getFormPermission)
    fastify.post('/forms/:id/permissions', { preHandler: [authMiddleware, permissionMiddleware] }, createFormPermission)
    fastify.delete('/forms/:formId/permissions/:id', { preHandler: [authMiddleware, permissionMiddleware] }, deleteFormPermission)

    // Template Permissions
    fastify.get('/templates/:id/permissions', { preHandler: [authMiddleware, templatePermissionMiddleware] }, getTemplatePermission)
    fastify.post('/templates/:id/permissions', { preHandler: [authMiddleware, templatePermissionMiddleware] }, createTemplatePermission)
    fastify.delete('/templates/:templateId/permissions/:id', { preHandler: [authMiddleware, templatePermissionMiddleware] }, deleteTemplatePermission)

    // Form Fields
    fastify.get('/forms/:id/fields', { preHandler: [authMiddleware, permissionMiddleware] }, getFormFields)
    fastify.patch('/forms/:id/fields', { preHandler: [authMiddleware, permissionMiddleware] }, bulkFormFields)

    // Template Fields
    fastify.get('/templates/:id/fields', { preHandler: [authMiddleware, templatePermissionMiddleware] }, getTemplateFields)
    fastify.patch('/templates/:id/fields', { preHandler: [authMiddleware, templatePermissionMiddleware] }, bulkTemplateFields)

    fastify.get('/forms/:id/live', liveCountHandler)

    // Submissions
    fastify.get('/forms/:id/submissions', { preHandler: [authMiddleware, permissionMiddleware] }, getSubmissionsByForm)
    fastify.post('/forms/:id/submissions', { preHandler: authMiddleware }, createSubmission)
    fastify.get('/submissions/:id', { preHandler: authMiddleware }, getSubmission)
    fastify.post('/submissions/:id/scan', { preHandler: authMiddleware }, scanSubmission)
    fastify.get('/submissions', { preHandler: authMiddleware }, getSubmissionsByUser)
    fastify.delete('/submissions/:id', { preHandler: authMiddleware }, deleteSubmission)
}
