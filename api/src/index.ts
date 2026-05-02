import { apiRoutes } from './routes.ts'
import getFavicon from './handlers/favicon/get.ts'
import { processEmailQueue } from './utils/email/sendSMTP.ts'
import { startInactiveUserCleanup } from './utils/users/inactiveCleanup.ts'
import { getCorsHeaders } from '#utils/http/cors.ts'

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
            const res = await handler(req)
            return addCorsToResponse(req, res)
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
                const corsHeaders = getCorsHeaders(req)
                if (req.method === 'OPTIONS') {
                    return new Response(null, { headers: corsHeaders })
                }
                return new Response('Not Found', { status: 404, headers: corsHeaders })
            }
        })

        console.log(`Server listening on ${server.url.origin}`)
        await processEmailQueue()
        await startInactiveUserCleanup()
    } catch (err) {
        console.error(err)
        process.exit(1)
    }
}

main()
