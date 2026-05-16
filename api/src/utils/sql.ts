import { readFile } from 'fs/promises'
import { join } from 'path'

const sqlCache = new Map<string, string>()
const identifierRegex = /^[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?$/
const searchableFieldRegex = /^[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?(?:::[a-zA-Z_][a-zA-Z0-9_]*)?$/

export function assertSafeIdentifier(value: string, label: string) {
    if (!/^[a-z_]+$/.test(value)) {
        throw new Error(`Unsafe SQL identifier for ${label}`)
    }
}

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
    const MAX_LIMIT = 100
    const search = query.search
    const parsedLimit = query.limit ? parseInt(query.limit) : MAX_LIMIT
    const limit = isNaN(parsedLimit) ? MAX_LIMIT : Math.min(Math.max(parsedLimit, 1), MAX_LIMIT)
    const parsedOffset = query.offset ? parseInt(query.offset) : 0
    const offset = isNaN(parsedOffset) || parsedOffset < 0 ? 0 : parsedOffset
    const orderBy = query.order_by || 'created_at'
    const sort = query.sort === 'asc' ? 'ASC' : 'DESC'

    let sql = baseSQL.trim()

    // Strip any top-level ORDER BY to prevent duplicate clauses when we append our own
    let parenDepth = 0
    let topLevelOrderByAt = -1
    const upperBase = sql.toUpperCase()
    for (let i = 0; i < upperBase.length; i++) {
        if (upperBase[i] === '(') parenDepth++
        else if (upperBase[i] === ')') parenDepth--
        else if (parenDepth === 0 && upperBase.startsWith('ORDER BY', i)) {
            topLevelOrderByAt = i
            break
        }
    }
    if (topLevelOrderByAt !== -1) {
        sql = sql.slice(0, topLevelOrderByAt).trimEnd()
    }

    const params = [...initialParams]

    if (search) {
        const defaultFields = [tablePrefix ? `${tablePrefix}.title` : 'title', tablePrefix ? `${tablePrefix}.description` : 'description']
        const fieldsToSearch = options?.searchFields?.length ? options.searchFields : defaultFields

        for (const field of fieldsToSearch) {
            if (!searchableFieldRegex.test(field)) {
                throw new Error(`Invalid search field: ${field}`)
            }
        }

        const escaped = search.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
        const clauses = fieldsToSearch.map((f) => `(${f} IS NOT NULL AND ${f} ILIKE $${params.length + 1} ESCAPE '\\')`).join(' OR ')

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

        params.push(`%${escaped}%`)
    }

    const explicitOrderField = options?.explicitOrderField
    const orderField = explicitOrderField || (tablePrefix ? `${tablePrefix}.${orderBy}` : orderBy)

    if (!identifierRegex.test(orderField)) {
        throw new Error('Invalid order_by parameter')
    }
    sql += ` ORDER BY ${orderField} ${sort}`

    sql += ` LIMIT $${params.length + 1}`
    params.push(limit)

    if (offset > 0) {
        sql += ` OFFSET $${params.length + 1}`
        params.push(offset)
    }

    return { sql, params }
}
