import { apiRoutes } from './routes.ts'
import getFavicon from './handlers/favicon/get.ts'
import { processEmailQueue } from './utils/email/sendSMTP.ts'
import { startInactiveUserCleanup } from './utils/users/inactiveCleanup.ts'
import { startFormRetentionCleanup } from './utils/forms/retentionCleanup.ts'
import { getCorsHeaders } from '#utils/http/cors.ts'
import { attachRequestContext, getRequestContext } from '#utils/http/requestContext.ts'
import { logError, logInfo, logWarn } from '#utils/logger.ts'

function addCorsToResponse(req: Request, res: Response | Promise<Response>): Response | Promise<Response> {
    const corsHeaders = getCorsHeaders(req)
    if (res instanceof Promise) {
        return res.then((r) => {
            for (const [k, v] of Object.entries(corsHeaders)) {
                r.headers.set(k, v)
            }
            return r
        })
    }
    for (const [k, v] of Object.entries(corsHeaders)) {
        res.headers.set(k, v)
    }
    return res
}

function getRequestId(req: Request): string {
    const headerId = req.headers.get('x-request-id')?.trim()
    if (headerId) return headerId
    return crypto.randomUUID()
}

type TreeNode = { methods: string[]; children: Record<string, TreeNode> }

function generateRouteTree(routesObj: Record<string, any>) {
    const root: TreeNode = { methods: [], children: {} };

    for (const [p, methodsObj] of Object.entries(routesObj)) {
        const parts = p.split('/').filter(Boolean);
        let current = root;
        for (let i = 0; i < parts.length; i++) {
            const part = `/${parts[i]}`;
            if (!current.children[part]) {
                current.children[part] = { methods: [], children: {} };
            }
            current = current.children[part];
            if (i === parts.length - 1) {
                current.methods.push(...Object.keys(methodsObj));
            }
        }
    }

    function printNode(node: Record<string, TreeNode>, prefix: string): string {
        let out = '';
        const keys = Object.keys(node).sort();
        keys.forEach((key, index) => {
            const isLast = index === keys.length - 1;
            const branch = isLast ? '└── ' : '├── ';
            const childNode = node[key];
            const methodsStr = childNode.methods.length > 0 ? ` (${childNode.methods.join(', ')})` : '';
            out += `${prefix}${branch}${key}${methodsStr}\n`;
            const nextPrefix = prefix + (isLast ? '    ' : '│   ');
            out += printNode(childNode.children, nextPrefix);
        });
        return out;
    }

    let treeStr = `BeeFormed API\n\n└── /\n`;
    treeStr += printNode(root.children, '    ');
    return treeStr;
}

const routes: Record<string, any> = {
    '/favicon.ico': { GET: getFavicon },
    ...apiRoutes
}

const cachedTree = generateRouteTree(routes)

routes['/'] = {
    GET: async (req: Request) => {
        return new Response(cachedTree)
    }
}

Object.keys(routes).forEach((route) => {
    const methods = routes[route as keyof typeof routes] as Record<string, any>
    Object.keys(methods).forEach((method) => {
        const handler = methods[method]
        methods[method] = async (req: Request) => {
            const start = performance.now()
            const requestId = getRequestId(req)
            const reqWithContext = attachRequestContext(req, requestId)
            const path = new URL(reqWithContext.url).pathname

            let res: Response
            try {
                res = await handler(reqWithContext)
            } catch (error) {
                logError('Unhandled request error', {
                    event: 'http.internal_error',
                    requestId,
                    error
                })
                res = Response.json({ error: 'Internal server error' }, { status: 500 })
            }

            const response = await addCorsToResponse(reqWithContext, res)
            response.headers.set('x-request-id', requestId)

            const durationMs = Math.round(performance.now() - start)
            const status = response.status
            const userId = getRequestContext(reqWithContext)?.userId
            const logMeta = {
                event: 'http.request.complete',
                requestId,
                method: reqWithContext.method,
                path,
                status,
                durationMs,
                userId
            }

            if (status >= 500) {
                logError('Request failed', logMeta)
            } else if (status >= 400) {
                logWarn('Request completed with client error', logMeta)
            } else {
                logInfo('Request completed', logMeta)
            }

            return response
        }
    })
})

const port = process.env.PORT || 8080

async function main() {
    try {
        const server = Bun.serve({
            port,
            hostname: '0.0.0.0',
            routes,
            fetch(req) {
                const start = performance.now()
                const requestId = getRequestId(req)
                const corsHeaders = getCorsHeaders(req)
                if (req.method === 'OPTIONS') {
                    const response = new Response(null, { headers: corsHeaders })
                    response.headers.set('x-request-id', requestId)
                    const durationMs = Math.round(performance.now() - start)
                    logInfo('Request completed', {
                        event: 'http.request.preflight',
                        requestId,
                        method: req.method,
                        path: new URL(req.url).pathname,
                        status: response.status,
                        durationMs
                    })
                    return response
                }
                const response = new Response('Not Found', { status: 404, headers: corsHeaders })
                response.headers.set('x-request-id', requestId)
                const durationMs = Math.round(performance.now() - start)
                logWarn('Route not found', {
                    event: 'http.request.not_found',
                    requestId,
                    method: req.method,
                    path: new URL(req.url).pathname,
                    status: response.status,
                    durationMs
                })
                return response
            }
        })

        logInfo('Server listening', {
            event: 'server.start',
            port,
            origin: server.url.origin
        })
        await processEmailQueue()
        await startInactiveUserCleanup()
        await startFormRetentionCleanup()
    } catch (err) {
        logError('Server failed to start', { event: 'server.start_failed', error: err })
        process.exit(1)
    }
}

main()
