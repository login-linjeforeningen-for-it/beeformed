import { readFile } from 'fs/promises'
import { join } from 'path'

const sqlCache = new Map<string, string>()
const identifierRegex = /^[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?$/

export async function loadSQL(file: string) {
    if (sqlCache.has(file)) {
        return sqlCache.get(file)!
    }

    const filePath = join(process.cwd(), 'src/queries/', file)
    const content = await readFile(filePath, 'utf-8')
    sqlCache.set(file, content)
    return content
}

export async function buildFilteredQuery(
    sqlPath: string,
    initialParams: SQLParamType[],
    query: {
        search?: string
        limit?: string
        offset?: string
        order_by?: string
        sort?: string
    },
    tablePrefix?: string,
    options?: {
        searchFields?: string[]
        explicitOrderField?: string
    }
) {
    const baseSQL = await loadSQL(sqlPath)
    const search = query.search
    const limit = query.limit ? parseInt(query.limit) : undefined
    const offset = query.offset ? parseInt(query.offset) : undefined
    const orderBy = query.order_by || 'created_at'
    const sort = query.sort === 'asc' ? 'ASC' : 'DESC'


    let sql = baseSQL.trim()
    const params = [...initialParams]

    if (search) {
        const fieldsToSearch: string[] = options?.searchFields && options.searchFields.length
            ? options.searchFields
            : [tablePrefix ? `${tablePrefix}.title` : 'title', tablePrefix ? `${tablePrefix}.description` : 'description']

        for (const field of fieldsToSearch) {
            if (!identifierRegex.test(field)) {
                throw new Error(`Invalid search field: ${field}`)
            }
        }

        const clauses = fieldsToSearch.map((f) => `(${f} IS NOT NULL AND ${f} ILIKE $${params.length + 1})`).join(' OR ')

        const upperSQL = sql.toUpperCase()
        const groupIdx = upperSQL.indexOf('GROUP BY')
        const orderIdx = upperSQL.indexOf('ORDER BY')
        const limitIdx = upperSQL.indexOf('LIMIT')
        const offsetIdx = upperSQL.indexOf('OFFSET')

        const candidateIdx = [groupIdx, orderIdx, limitIdx, offsetIdx].filter(i => i >= 0)
        const insertAt = candidateIdx.length ? Math.min(...candidateIdx) : -1

        const hasWhere = /\bWHERE\b/i.test(sql)
        if (insertAt >= 0) {
            const prefix = sql.slice(0, insertAt).trimEnd()
            const suffix = sql.slice(insertAt)
            sql = prefix + (hasWhere ? ` AND (${clauses}) ` : ` WHERE (${clauses}) `) + suffix
        } else {
            sql += hasWhere ? ` AND (${clauses})` : ` WHERE (${clauses})`
        }

        params.push(`%${search}%`)
    }

    const explicitOrderField = options?.explicitOrderField
    const orderField = explicitOrderField || (tablePrefix ? `${tablePrefix}.${orderBy}` : orderBy)

    if (!identifierRegex.test(orderField)) {
        throw new Error('Invalid order_by parameter')
    }
    sql += ` ORDER BY ${orderField} ${sort}`

    if (limit) {
        sql += ` LIMIT $${params.length + 1}`
        params.push(limit)
    }

    if (offset) {
        sql += ` OFFSET $${params.length + 1}`
        params.push(offset)
    }

    return { sql, params }
}
