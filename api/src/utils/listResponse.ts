export function buildListResponse(rows: Record<string, unknown>[]) {
    const total = rows.length > 0 ? (rows[0].total_count as number) : 0
    return { data: rows, total }
}
