import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import { runInTransaction } from '#db'
import { loadSQL } from '#utils/sql.ts'
import { logError } from '#utils/logger.ts'

function createHttpError(statusCode: number, message: string): Error & { statusCode: number } {
    const err = new Error(message) as Error & { statusCode: number }
    err.statusCode = statusCode
    return err
}

export default async function bulkFormFields(
    req: AuthenticatedRequest<{ Params: IdParams; Body: BulkFormFieldOperation[] }>,
    res: FastifyReply
) {
    const routeFormId = req.params.id
    const operations = req.body

    if (!Array.isArray(operations)) {
        return res.status(400).send({ error: 'Operations must be an array' })
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

        return res.status(200).send(results)
    } catch (error: unknown) {
        const status =
            typeof error === 'object'
            && error !== null
            && 'statusCode' in error
            && typeof (error as { statusCode: unknown }).statusCode === 'number'
                ? (error as { statusCode: number }).statusCode
                : undefined
        if (status !== undefined && status >= 400 && status < 500) {
            return res.status(status).send({
                error: error instanceof Error ? error.message : 'Bad request'
            })
        }
        logError('Error in bulk save', {
            event: 'http.internal_error',
            requestId: req.id,
            error
        })
        return res.status(500).send({ error: 'Internal server error' })
    }
}
