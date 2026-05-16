import type pg from 'pg'

function escapeRegex(s: string): string {
    return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
}

export function buildUniqueTitle(sourceTitle: string, copyIndex: number, suffix: string): string {
    const stripped = sourceTitle.replace(new RegExp(` ${escapeRegex(suffix)}(?: [0-9]+)?$`), '')
    return copyIndex === 1 ? `${stripped} ${suffix}` : `${stripped} ${suffix} ${copyIndex}`
}

export function buildUniqueSlug(sourceSlug: string, copyIndex: number, suffix: string): string {
    const stripped = sourceSlug.replace(new RegExp(`-${escapeRegex(suffix)}(?:-[0-9]+)?$`), '')
    return copyIndex === 1 ? `${stripped}-${suffix}` : `${stripped}-${suffix}-${copyIndex}`
}

export type SourceEntity = {
    slug: string
    title: string
    description: string | null
    anonymous_submissions: boolean
    limit: number | null
    waitlist: boolean
    multiple_submissions: boolean
    published_at: Date
    expires_at: Date
}

type FieldRow = {
    field_type: string
    title: string
    description: string | null
    required: boolean
    options: string[] | null
    validation: unknown
    field_order: number
}

export async function findUniqueSlug(
    client: pg.PoolClient,
    checkSlugExistsSql: string,
    sourceSlug: string,
    suffix: string,
    errorMessage: string,
    maxAttempts = 10
): Promise<{ slug: string; copyIndex: number }> {
    let copyIndex = 1
    let slug = buildUniqueSlug(sourceSlug, copyIndex, suffix)

    while (copyIndex <= maxAttempts) {
        const existsResult = await client.query(checkSlugExistsSql, [slug])
        if (!existsResult.rows[0]?.exists) break
        copyIndex += 1
        slug = buildUniqueSlug(sourceSlug, copyIndex, suffix)
    }

    if (copyIndex > maxAttempts) {
        throw Object.assign(new Error(errorMessage), { statusCode: 409 })
    }

    return { slug, copyIndex }
}

export async function copyFieldsToTarget(
    client: pg.PoolClient,
    getFieldsSql: string,
    createFieldSql: string,
    sourceId: string,
    targetId: string
): Promise<void> {
    const fieldsResult = await client.query(getFieldsSql, [sourceId])
    for (const field of fieldsResult.rows as FieldRow[]) {
        await client.query(createFieldSql, [
            targetId,
            field.field_type,
            field.title,
            field.description,
            field.required,
            field.options,
            field.validation,
            field.field_order
        ])
    }
}
