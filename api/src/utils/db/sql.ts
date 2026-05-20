import type { SQLParamType } from '#db'
import { readFile } from 'fs/promises'
import { join } from 'path'

const sqlCache = new Map<string, string>()
const identifierRegex = /^[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?$/
const searchableFieldRegex = /^[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?(?:::[a-zA-Z_][a-zA-Z0-9_]*)?$/

export function assertSafeIdentifier(value: string, label: string) {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
        throw new Error(`Unsafe SQL identifier for ${label}`)
    }
}

export async function loadSQL(file: string) {
    if (sqlCache.has(file)) {
        return sqlCache.get(file)!
    }
    const content = await readFile(join(process.cwd(), 'src/queries/', file), 'utf-8')
    sqlCache.set(file, content)
    return content
}

export async function buildFilteredQuery(
    sqlPath: string,
    initialParams: SQLParamType[],
    query: { search?: string; limit?: string; offset?: string; order_by?: string; sort?: string },
    options?: { searchFields?: string[]; orderField?: string }
) {
    const MAX_LIMIT = 100
    const limit = Math.min(Math.max(parseInt(query.limit ?? '') || MAX_LIMIT, 1), MAX_LIMIT)
    const offset = Math.max(parseInt(query.offset ?? '') || 0, 0)
    const sort = query.sort === 'asc' ? 'ASC' : 'DESC'
    const orderBy = options?.orderField ?? query.order_by ?? 'created_at'

    if (!identifierRegex.test(orderBy)) throw new Error('Invalid order_by parameter')

    const params = [...initialParams]
    const base = (await loadSQL(sqlPath)).trim()

    let searchClause = ''
    if (query.search) {
        const fields = options?.searchFields ?? ['title', 'description']
        if (fields.some(f => !searchableFieldRegex.test(f))) throw new Error('Invalid search field')
        const clauses = fields.map(f => `(${f} IS NOT NULL AND POSITION($${params.length + 1} IN LOWER(${f})) > 0)`).join(' OR ')
        searchClause = `WHERE (${clauses})`
        params.push(query.search.toLowerCase())
    }

    const parts = [
        `WITH _base AS (${base})`,
        `SELECT *, COUNT(*) OVER() AS total_count FROM _base`,
        searchClause,
        `ORDER BY ${orderBy} ${sort} LIMIT $${params.length + 1}${offset > 0 ? ` OFFSET $${params.length + 2}` : ''}`,
    ]
    const sql = parts.filter(Boolean).join('\n')

    params.push(limit)
    if (offset > 0) params.push(offset)

    return { sql, params }
}
