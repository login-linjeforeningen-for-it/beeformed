export function getCorsHeaders(req: Request): Record<string, string> {
    const origin = req.headers.get('origin')
    if (!origin) return { 'Access-Control-Allow-Origin': '*' }

    try {
        const host = new URL(origin).hostname
        const isFull = ['forms.login.no', 'localhost'].includes(host)
        const isRead = ['login.no', 'queenbee.login.no'].includes(host)
        
        if (isFull || isRead) {
            return {
                'Access-Control-Allow-Origin': origin,
                'Access-Control-Allow-Methods': isFull ? 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD' : 'GET, HEAD, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        }
    } catch {}

    return {}
}

