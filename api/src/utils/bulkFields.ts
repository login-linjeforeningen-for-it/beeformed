import type pg from 'pg'
import { loadSQL } from '#utils/sql.ts'

type BulkFieldOp = {
    operation: 'create' | 'update' | 'delete'
    id?: string
    data?: {
        field_type?: string
        title?: string
        description?: string | null
        required?: boolean
        options?: string[] | null
        validation?: unknown
        field_order?: number
        form_id?: string
        template_id?: string
    }
}

type BulkFieldsConfig = {
    entityIdKey: 'form_id' | 'template_id'
    entityType: 'form' | 'template'
    sqlDir: 'form-fields' | 'template-fields'
}

type BulkFieldsResult = {
    created: unknown[]
    updated: unknown[]
    deleted: string[]
}

function extractValidationJson(validation: unknown): string | null {
    if (!validation) return null
    const json = JSON.stringify(validation)
    if (json.length > 10_000) throw Object.assign(new Error('validation field exceeds maximum size'), { statusCode: 400 })
    return json
}

export async function executeBulkFieldOps(
    client: pg.PoolClient,
    operations: BulkFieldOp[],
    routeId: string,
    config: BulkFieldsConfig
): Promise<BulkFieldsResult> {
    const { entityIdKey, entityType, sqlDir } = config
    const results: BulkFieldsResult = { created: [], updated: [], deleted: [] }

    for (const op of operations.filter(o => o.operation === 'delete')) {
        if (!op.id) throw Object.assign(new Error('Delete operation requires id'), { statusCode: 400 })
        const deleteSql = await loadSQL(`${sqlDir}/delete.sql`)
        const delResult = await client.query(deleteSql, [op.id, routeId])
        if (delResult.rowCount === 0) throw Object.assign(new Error(`Field not found on this ${entityType}`), { statusCode: 404 })
        results.deleted.push(op.id)
    }

    for (const op of operations.filter(o => o.operation === 'update')) {
        if (!op.id || !op.data) throw Object.assign(new Error('Update operation requires id and data'), { statusCode: 400 })
        const requiredFields = ['field_type', 'title', 'required', 'field_order'] as const
        for (const field of requiredFields) {
            if (!(field in op.data)) throw Object.assign(new Error(`${field} is required for update`), { statusCode: 400 })
        }
        const validationJson = extractValidationJson(op.data.validation)
        const updateSql = await loadSQL(`${sqlDir}/update.sql`)
        const result = await client.query(updateSql, [
            op.id, op.data.field_type, op.data.title, op.data.description || null,
            op.data.required, op.data.options || null, validationJson, op.data.field_order, routeId
        ])
        if (!result.rows[0]) throw Object.assign(new Error(`Field not found on this ${entityType}`), { statusCode: 404 })
        results.updated.push(result.rows[0])
    }

    for (const op of operations.filter(o => o.operation === 'create')) {
        if (!op.data) throw Object.assign(new Error('Create operation requires data'), { statusCode: 400 })
        const requiredFields = ['field_type', 'title', 'required', 'field_order'] as const
        for (const field of requiredFields) {
            if (!(field in op.data)) throw Object.assign(new Error(`${field} is required for create`), { statusCode: 400 })
        }
        if (op.data[entityIdKey] !== undefined && op.data[entityIdKey] !== routeId) {
            throw Object.assign(new Error(`${entityIdKey} must match the ${entityType} in the URL`), { statusCode: 400 })
        }
        const validationJson = extractValidationJson(op.data.validation)
        const createSql = await loadSQL(`${sqlDir}/insert.sql`)
        const result = await client.query(createSql, [
            routeId, op.data.field_type, op.data.title, op.data.description || null,
            op.data.required, op.data.options || null, validationJson, op.data.field_order
        ])
        results.created.push(result.rows[0])
    }

    return results
}
