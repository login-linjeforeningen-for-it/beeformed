export function buildListResponse(rows: Record<string, unknown>[]) {
    const total = rows.length > 0 ? Number(rows[0].total_count ?? 0) : 0
    return { data: rows, total }
}
