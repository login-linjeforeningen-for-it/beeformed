import { runInTransaction } from '#db'
import { loadSQL } from '#utils/sql.ts'
import { createHttpError, httpStatusFromError, sendInternalServerError } from '#utils/http/errors.ts'
import type { AuthRequest } from '#utils/auth/authMiddleware.ts'

interface BulkOperation {
    operation: 'create' | 'update' | 'delete'
    id?: string
    data?: Partial<{
        form_id: string
        field_type: string
        title: string
        description?: string
        required: boolean
        options?: string[]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        validation?: any
        field_order: number
    }>
}

export default async function bulkFormFields(req: AuthRequest<'id'>) {
    const routeFormId = req.params?.id
    if (!routeFormId) {
        return Response.json({ error: 'Missing form ID' }, { status: 400 })
    }

    const operations = await req.json() as BulkOperation[]

    if (!Array.isArray(operations)) {
        return Response.json({ error: 'Operations must be an array' }, { status: 400 })
    }

    try {
        const results = await runInTransaction(async (client) => {
            const results = {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                created: [] as any[],
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                updated: [] as any[],
                deleted: [] as string[]
            }

            for (const op of operations.filter((o) => o.operation === 'delete')) {
                if (!op.id) {
                    throw createHttpError(400, 'Delete operation requires id')
                }

                const deleteSql = await loadSQL('form-fields/delete.sql')
                const delResult = await client.query(deleteSql, [op.id, routeFormId])
                if (delResult.rowCount === 0) {
                    throw createHttpError(404, 'Field not found on this form')
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

                const updateSql = await loadSQL('form-fields/put.sql')
                const params = [
                    op.id,
                    op.data.field_type,
                    op.data.title,
                    op.data.description || null,
                    op.data.required,
                    op.data.options || null,
                    op.data.validation ? JSON.stringify(op.data.validation) : null,
                    op.data.field_order,
                    routeFormId
                ]
                const result = await client.query(updateSql, params)
                if (!result.rows[0]) {
                    throw createHttpError(404, 'Field not found on this form')
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

                if (op.data.form_id !== undefined && op.data.form_id !== routeFormId) {
                    throw createHttpError(400, 'form_id must match the form in the URL')
                }

                const createSql = await loadSQL('form-fields/post.sql')
                const params = [
                    routeFormId,
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
