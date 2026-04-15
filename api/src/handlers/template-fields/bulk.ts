import type { FastifyReply, FastifyRequest } from 'fastify'
import { runInTransaction } from '#db'
import { loadSQL } from '#utils/sql.ts'
import { sendInternalServerError } from '#utils/http/errors.ts'

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

export default async function bulkTemplateFields(req: FastifyRequest, res: FastifyReply) {
    const operations = req.body as BulkOperation[]

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

            for (const op of operations.filter(op => op.operation === 'delete')) {
                if (!op.id) {
                    throw new Error('Delete operation requires id')
                }

                const deleteSql = await loadSQL('template-fields/delete.sql')
                await client.query(deleteSql, [op.id])
                results.deleted.push(op.id)
            }

            for (const op of operations.filter(op => op.operation === 'update')) {
                if (!op.id || !op.data) {
                    throw new Error('Update operation requires id and data')
                }

                const requiredFields = ['field_type', 'title', 'required', 'field_order']
                for (const field of requiredFields) {
                    if (!(field in op.data)) {
                        throw new Error(`${field} is required for update`)
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
                    op.data.field_order
                ]
                const result = await client.query(updateSql, params)
                results.updated.push(result.rows[0])
            }

            for (const op of operations.filter(op => op.operation === 'create')) {
                if (!op.data) {
                    throw new Error('Create operation requires data')
                }

                const requiredFields = ['template_id', 'field_type', 'title', 'required', 'field_order']
                for (const field of requiredFields) {
                    if (!(field in op.data)) {
                        throw new Error(`${field} is required for create`)
                    }
                }

                const createSql = await loadSQL('template-fields/post.sql')
                const params = [
                    op.data.template_id,
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

        res.status(200).send(results)
    } catch (error) {
        return sendInternalServerError(res, 'Error in bulk save:', error)
    }
}
