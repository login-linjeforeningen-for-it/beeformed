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
