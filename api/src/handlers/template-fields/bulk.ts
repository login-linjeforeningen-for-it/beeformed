import { runInTransaction } from '#db'
import { loadSQL } from '#utils/sql.ts'
import { createHttpError, httpStatusFromError, sendInternalServerError } from '#utils/http/errors.ts'
import type { AuthRequest } from '#utils/auth/authMiddleware.ts'

interface BulkOperation {
    operation: 'create' | 'update' | 'delete'
    id?: string
    data?: Partial<{
        template_id: string
        field_type: string
        title: string
        description?: string
        required: boolean
        options?: string[]
        validation?: unknown
        field_order: number
    }>
}

export default async function bulkTemplateFields(req: AuthRequest<'id'>) {
    const routeTemplateId = req.params?.id
    if (!routeTemplateId) {
        return Response.json({ error: 'Missing template ID' }, { status: 400 })
    }

    const operations = await req.json() as BulkOperation[]

    if (!Array.isArray(operations)) {
        return Response.json({ error: 'Operations must be an array' }, { status: 400 })
    }

    try {
        const results = await runInTransaction(async (client) => {
            const results = {
                created: [] as unknown[],
                updated: [] as unknown[],
                deleted: [] as string[]
            }

            for (const op of operations.filter((o) => o.operation === 'delete')) {
                if (!op.id) {
                    throw createHttpError(400, 'Delete operation requires id')
                }

                const deleteSql = await loadSQL('template-fields/delete.sql')
                const delResult = await client.query(deleteSql, [op.id, routeTemplateId])
                if (delResult.rowCount === 0) {
                    throw createHttpError(404, 'Field not found on this template')
                }
                results.deleted.push(op.id)
            }

            for (const op of operations.filter((o) => o.operation === 'update')) {
                if (!op.id || !op.data) {
                    throw createHttpError(400, 'Update operation requires id and data')
                }

                const requiredFields = ['field_type', 'title', 'required', 'field_order'] as const
                for (const field of requiredFields) {
                    if (!(field in op.data)) {
                        throw createHttpError(400, `${field} is required for update`)
                    }
                }

                const updateSql = await loadSQL('template-fields/put.sql')
                const params = [
                    op.id,
                    op.data.field_type,
                    op.data.title,
                    op.data.description || null,
                    op.data.required,
                    op.data.options || null,
                    op.data.validation ? JSON.stringify(op.data.validation) : null,
                    op.data.field_order,
                    routeTemplateId
                ]
                const result = await client.query(updateSql, params)
                if (!result.rows[0]) {
                    throw createHttpError(404, 'Field not found on this template')
                }
                results.updated.push(result.rows[0])
            }

            for (const op of operations.filter((o) => o.operation === 'create')) {
                if (!op.data) {
                    throw createHttpError(400, 'Create operation requires data')
                }

                const requiredFields = ['field_type', 'title', 'required', 'field_order'] as const
                for (const field of requiredFields) {
                    if (!(field in op.data)) {
                        throw createHttpError(400, `${field} is required for create`)
                    }
                }

                if (op.data.template_id !== undefined && op.data.template_id !== routeTemplateId) {
                    throw createHttpError(400, 'template_id must match the template in the URL')
                }

                const createSql = await loadSQL('template-fields/post.sql')
                const params = [
                    routeTemplateId,
                    op.data.field_type,
                    op.data.title,
                    op.data.description || null,
                    op.data.required,
                    op.data.options || null,
                    op.data.validation ? JSON.stringify(op.data.validation) : null,
                    op.data.field_order
                ]
                const result = await client.query(createSql, params)
                results.created.push(result.rows[0])
            }

            return results
        })

        return Response.json(results, { status: 200 })
    } catch (error: unknown) {
        const status = httpStatusFromError(error)
        if (status !== undefined && status >= 400 && status < 500) {
            return Response.json(
                { error: error instanceof Error ? error.message : 'Bad request' },
                { status }
            )
        }
        return sendInternalServerError('Error in bulk save:', error)
    }
}
