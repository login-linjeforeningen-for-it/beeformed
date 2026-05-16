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

const MAX_RANGE_MONTHS = 6

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
