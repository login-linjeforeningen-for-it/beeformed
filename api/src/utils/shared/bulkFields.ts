import type pg from 'pg'
import { loadSQL } from '#utils/db/sql.ts'
import { HttpError } from '#db'
import type { BulkFormFieldOperation, BulkTemplateFieldOperation } from '#schemas.ts'

type BulkFieldOp = BulkFormFieldOperation | BulkTemplateFieldOperation

type BulkFieldsConfig = {
    entityIdKey: 'form_id' | 'template_id'
    entityType: 'form' | 'template'
    sqlDir: 'form-fields' | 'template-fields'
    softDeleteWhenReferenced: boolean
}

type BulkFieldsResult = {
    created: unknown[]
    updated: unknown[]
    deleted: string[]
}

export async function executeBulkFieldOps(
    client: pg.PoolClient,
    operations: BulkFieldOp[],
    routeId: string,
    config: BulkFieldsConfig
): Promise<BulkFieldsResult> {
    const { entityIdKey, entityType, sqlDir } = config
    const results: BulkFieldsResult = { created: [], updated: [], deleted: [] }

    for (const op of operations) {
        switch (op.operation) {
            case 'delete': {
                if (config.softDeleteWhenReferenced) {
                    const checkSql = await loadSQL(`${sqlDir}/selectForDelete.sql`)
                    const checkResult = await client.query(checkSql, [op.id, routeId])
                    if (checkResult.rowCount === 0) throw new HttpError(404, `Field not found on this ${entityType}`)

                    if (checkResult.rows[0].has_answers) {
                        const softDeleteSql = await loadSQL(`${sqlDir}/softDelete.sql`)
                        await client.query(softDeleteSql, [op.id, routeId])
                    } else {
                        const deleteSql = await loadSQL(`${sqlDir}/delete.sql`)
                        await client.query(deleteSql, [op.id, routeId])
                    }
                } else {
                    const deleteSql = await loadSQL(`${sqlDir}/delete.sql`)
                    const delResult = await client.query(deleteSql, [op.id, routeId])
                    if (delResult.rowCount === 0) throw new HttpError(404, `Field not found on this ${entityType}`)
                }
                results.deleted.push(op.id)
                break
            }
            case 'update': {
                const updateSql = await loadSQL(`${sqlDir}/update.sql`)
                const result = await client.query(updateSql, [
                    op.id, op.data.field_type, op.data.title, op.data.description ?? null,
                    op.data.required, op.data.options || null, op.data.field_order, routeId
                ])
                if (!result.rows[0]) throw new HttpError(404, `Field not found on this ${entityType}`)
                results.updated.push(result.rows[0])
                break
            }
            case 'create': {
                const entityIdInData = (op.data as Record<string, unknown>)[entityIdKey]
                if (entityIdInData !== undefined && entityIdInData !== routeId) {
                    throw new HttpError(400, `${entityIdKey} must match the ${entityType} in the URL`)
                }
                const createSql = await loadSQL(`${sqlDir}/insert.sql`)
                const result = await client.query(createSql, [
                    routeId, op.data.field_type, op.data.title, op.data.description ?? null,
                    op.data.required, op.data.options || null, op.data.field_order
                ])
                results.created.push(result.rows[0])
                break
            }
        }
    }

    return results
}
