type DateRangeValidationResult = {
    valid: boolean
    error?: string
    publishedAt?: Date
    expiresAt?: Date
}

const SLUG_PATTERN = /^[a-z0-9-_]+$/
const MAX_RANGE_MS = 365 * 24 * 60 * 60 * 1000

export function isValidSlug(slug: string): boolean {
    return SLUG_PATTERN.test(slug)
}

export function validatePublicationWindow(publishedAtRaw: string, expiresAtRaw: string): DateRangeValidationResult {
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

    if (expiresAt.getTime() - new Date().getTime() > MAX_RANGE_MS) {
        return {
            valid: false,
            error: 'expire date cannot be more than one year in the future'
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
