export type RequestContext = {
    requestId: string
    userId?: string
}

export type RequestWithContext = Request & { context?: RequestContext }

export function attachRequestContext(req: Request, requestId: string): RequestWithContext {
    const reqWithContext = req as RequestWithContext
    if (reqWithContext.context) {
        reqWithContext.context.requestId = requestId
    } else {
        reqWithContext.context = { requestId }
    }
    return reqWithContext
}

export function getRequestContext(req: Request): RequestContext | undefined {
    return (req as RequestWithContext).context
}
