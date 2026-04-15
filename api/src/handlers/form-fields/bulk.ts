import type { FastifyReply, FastifyRequest } from 'fastify'
import { runInTransaction } from '#db'
import { loadSQL } from '#utils/sql.ts'

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

export default async function bulkFormFields(req: FastifyRequest, res: FastifyReply) {
    const operations = req.body as BulkOperation[]

    if (!Array.isArray(operations)) {
        return res.status(400).send({ error: 'Operations must be an array' })
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

            // Handle deletes
            for (const op of operations.filter(op => op.operation === 'delete')) {
                if (!op.id) {
                    throw new Error('Delete operation requires id')
                }

                const deleteSql = await loadSQL('form-fields/delete.sql')
                await client.query(deleteSql, [op.id])
                results.deleted.push(op.id)
            }

            // Handle updates
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

                const updateSql = await loadSQL('form-fields/put.sql')
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

            // Handle creates
            for (const op of operations.filter(op => op.operation === 'create')) {
                if (!op.data) {
                    throw new Error('Create operation requires data')
                }

                const requiredFields = ['form_id', 'field_type', 'title', 'required', 'field_order']
                for (const field of requiredFields) {
                    if (!(field in op.data)) {
                        throw new Error(`${field} is required for create`)
                    }
                }

                const createSql = await loadSQL('form-fields/post.sql')
                const params = [
                    op.data.form_id,
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
        console.error('Error in bulk save:', error)
        res.status(500).send({ error: 'Internal server error' })
    }
}