import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import { runInTransaction } from '#db'
import { loadSQL } from '#utils/sql.ts'
import { logError } from '#utils/logger.ts'
import { createHttpError } from '#utils/httpError.ts'
import { validateLengths, MAX_FIELD_TITLE_LENGTH, MAX_FIELD_DESCRIPTION_LENGTH, VALID_FIELD_TYPES } from '#utils/validators.ts'

export default async function bulkTemplateFields(
    req: AuthenticatedRequest<{ Params: IdParams; Body: BulkTemplateFieldOperation[] }>,
    res: FastifyReply
) {
    const routeTemplateId = req.params.id
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

                if (op.data.field_type && !(VALID_FIELD_TYPES as readonly string[]).includes(op.data.field_type)) {
                    throw createHttpError(400, `Invalid field_type: must be one of ${VALID_FIELD_TYPES.join(', ')}`)
                }

                const fieldLengthError = validateLengths([
                    { value: op.data.title,       max: MAX_FIELD_TITLE_LENGTH,       label: 'title' },
                    { value: op.data.description, max: MAX_FIELD_DESCRIPTION_LENGTH, label: 'description' },
                ])
                if (fieldLengthError) throw createHttpError(400, fieldLengthError)

                let validationJson: string | null = null
                if (op.data.validation) {
                    validationJson = JSON.stringify(op.data.validation)
                    if (validationJson.length > 10_000) throw createHttpError(400, 'validation field exceeds maximum size')
                }

                const updateSql = await loadSQL('template-fields/put.sql')
                const params = [
                    op.id,
                    op.data.field_type,
                    op.data.title,
                    op.data.description || null,
                    op.data.required,
                    op.data.options || null,
                    validationJson,
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

                if (op.data.field_type && !(VALID_FIELD_TYPES as readonly string[]).includes(op.data.field_type)) {
                    throw createHttpError(400, `Invalid field_type: must be one of ${VALID_FIELD_TYPES.join(', ')}`)
                }

                const fieldLengthError = validateLengths([
                    { value: op.data.title,       max: MAX_FIELD_TITLE_LENGTH,       label: 'title' },
                    { value: op.data.description, max: MAX_FIELD_DESCRIPTION_LENGTH, label: 'description' },
                ])
                if (fieldLengthError) throw createHttpError(400, fieldLengthError)

                if (op.data.template_id !== undefined && op.data.template_id !== routeTemplateId) {
                    throw createHttpError(400, 'template_id must match the template in the URL')
                }

                let validationJson: string | null = null
                if (op.data.validation) {
                    validationJson = JSON.stringify(op.data.validation)
                    if (validationJson.length > 10_000) throw createHttpError(400, 'validation field exceeds maximum size')
                }

                const createSql = await loadSQL('template-fields/post.sql')
                const params = [
                    routeTemplateId,
                    op.data.field_type,
                    op.data.title,
                    op.data.description || null,
                    op.data.required,
                    op.data.options || null,
                    validationJson,
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
