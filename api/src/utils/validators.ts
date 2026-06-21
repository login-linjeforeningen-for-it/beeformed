import { HttpError } from '#db'

type DateRangeValidationOptions = {
    baseDate?: Date
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
): { publishedAt: Date, expiresAt: Date } {
    const publishedAt = new Date(publishedAtRaw)
    const expiresAt = new Date(expiresAtRaw)

    const baseDate = options.baseDate ?? new Date()
    const maxAllowedDate = addMonths(baseDate, MAX_RANGE_MONTHS)

    if (expiresAt > maxAllowedDate) {
        throw new HttpError(400, options.maxRangeMessage ?? 'expires_at cannot be more than six months in the future')
    }

    return { publishedAt, expiresAt }
}
