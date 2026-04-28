import getIndex from './handlers/index/get.ts'
import getPing from './handlers/ping/get.ts'

import { withAuth } from './utils/auth/authMiddleware.ts'
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

export const apiRoutes = {
    '/api': { GET: getIndex },
    '/api/ping': { GET: getPing },

    // Users
    '/api/users': {
        POST: withAuth(createUser),
        GET: withAuth(getUser),
        DELETE: withAuth(deleteUser)
    },

    // Forms Collection
    '/api/forms': {
        POST: withAuth(createForm),
        GET: withAuth(getForms)
    },
    '/api/forms/shared': { GET: withAuth(getSharedForms) },

    // Forms Single
    '/api/forms/:id': {
        GET: withAuth(permissionMiddleware(getForm)),
        PUT: withAuth(permissionMiddleware(updateForm)),
        DELETE: withAuth(permissionMiddleware(deleteForm))
    },
    '/api/forms/:id/public': { GET: getPublicForm },
    '/api/forms/:id/duplicate': { POST: withAuth(permissionMiddleware(duplicateForm)) },
    '/api/forms/:id/templates': { POST: withAuth(permissionMiddleware(createTemplateFromForm)) },

    // Templates Collection
    '/api/templates': {
        POST: withAuth(createTemplate),
        GET: withAuth(getTemplates)
    },
    '/api/templates/shared': { GET: withAuth(getSharedTemplates) },

    // Templates Single
    '/api/templates/:id': {
        GET: withAuth(templatePermissionMiddleware(getTemplate)),
        PUT: withAuth(templatePermissionMiddleware(updateTemplate)),
        DELETE: withAuth(templatePermissionMiddleware(deleteTemplate))
    },
    '/api/templates/:id/duplicate': { POST: withAuth(templatePermissionMiddleware(createFormFromTemplate)) },

    // Form Permissions
    '/api/forms/:id/permissions': {
        GET: withAuth(permissionMiddleware(getFormPermission)),
        POST: withAuth(permissionMiddleware(createFormPermission))
    },
    '/api/forms/:formId/permissions/:id': {
        DELETE: withAuth(permissionMiddleware(deleteFormPermission))
    },

    // Template Permissions
    '/api/templates/:id/permissions': {
        GET: withAuth(templatePermissionMiddleware(getTemplatePermission)),
        POST: withAuth(templatePermissionMiddleware(createTemplatePermission))
    },
    '/api/templates/:templateId/permissions/:id': {
        DELETE: withAuth(templatePermissionMiddleware(deleteTemplatePermission))
    },

    // Form Fields
    '/api/forms/:id/fields': {
        GET: withAuth(permissionMiddleware(getFormFields)),
        PATCH: withAuth(permissionMiddleware(bulkFormFields))
    },

    // Template Fields
    '/api/templates/:id/fields': {
        GET: withAuth(templatePermissionMiddleware(getTemplateFields)),
        PATCH: withAuth(templatePermissionMiddleware(bulkTemplateFields))
    },

    '/api/forms/:id/live': { GET: getLiveCount },

    // Submissions
    '/api/forms/:id/submissions': {
        GET: withAuth(permissionMiddleware(getSubmissionsByForm)),
        POST: withAuth(createSubmission)
    },
    '/api/submissions': {
        GET: withAuth(getSubmissionsByUser)
    },
    '/api/submissions/:id': {
        GET: withAuth(getSubmission),
        DELETE: withAuth(deleteSubmission)
    },
    '/api/submissions/:id/scan': {
        POST: withAuth(scanSubmission)
    }
}

