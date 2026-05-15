type DateRangeValidationResult = {
    valid: boolean
    error?: string
    publishedAt?: Date
    expiresAt?: Date
}

type DateRangeValidationOptions = {
    baseDate?: Date
    maxRangeMonths?: number
    maxRangeMessage?: string
}

const SLUG_PATTERN = /^[a-z0-9-_]+$/
const MAX_RANGE_MONTHS = 6

export const MAX_SLUG_LENGTH = 100
export const MAX_TITLE_LENGTH = 255
export const MAX_DESCRIPTION_LENGTH = 5000
export const MAX_FIELD_TITLE_LENGTH = 255
export const MAX_FIELD_DESCRIPTION_LENGTH = 2000

export function validateLengths(
    fields: { value: string | null | undefined; max: number; label: string }[]
): string | null {
    for (const { value, max, label } of fields) {
        if (value && value.length > max) {
            return `${label} must be at most ${max} characters`
        }
    }
    return null
}

export function isValidSlug(slug: string): boolean {
    return SLUG_PATTERN.test(slug)
}

function addMonths(date: Date, months: number) {
    const result = new Date(date)
    result.setMonth(result.getMonth() + months)
    return result
}

export function validatePublicationWindow(
    publishedAtRaw: string,
    expiresAtRaw: string,
    options: DateRangeValidationOptions = {}
): DateRangeValidationResult {
    const publishedAt = new Date(publishedAtRaw)
    const expiresAt = new Date(expiresAtRaw)

    if (isNaN(publishedAt.getTime()) || isNaN(expiresAt.getTime())) {
        return {
            valid: false,
            error: 'published_at and expires_at must be valid dates'
        }
    }

    if (publishedAt >= expiresAt) {
        return {
            valid: false,
            error: 'expires_at must be later than published_at'
        }
    }

    const baseDate = options.baseDate ?? new Date()
    const maxRangeMonths = options.maxRangeMonths ?? MAX_RANGE_MONTHS
    const maxAllowedDate = addMonths(baseDate, maxRangeMonths)

    if (expiresAt > maxAllowedDate) {
        return {
            valid: false,
            error: options.maxRangeMessage ?? 'expire date cannot be more than six months in the future'
        }
    }

    return {
        valid: true,
        publishedAt,
        expiresAt
    }
}

export function hasRequiredGroup(groups: string[] | undefined, requiredGroup: string): boolean {
    return Array.isArray(groups) && groups.includes(requiredGroup)
}
