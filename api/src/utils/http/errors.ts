export type HttpMarkedError = Error & { statusCode: number }

export function createHttpError(statusCode: number, message: string): HttpMarkedError {
    const err = new Error(message) as HttpMarkedError
    err.statusCode = statusCode
    return err
}

export function httpStatusFromError(error: unknown): number | undefined {
    if (
        typeof error === 'object'
        && error !== null
        && 'statusCode' in error
        && typeof (error as { statusCode: unknown }).statusCode === 'number'
    ) {
        return (error as HttpMarkedError).statusCode
    }
    return undefined
}

export function isInvalidOrderByError(error: unknown): error is Error {
    return error instanceof Error && error.message === 'Invalid order_by parameter'
}

export function sendInternalServerError(context: string, error: unknown) {
    console.error(context, error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
}

export function logUtilityError(context: string, error?: unknown) {
    if (error === undefined) {
        console.error(context)
        return
    }

    console.error(context, error)
}
