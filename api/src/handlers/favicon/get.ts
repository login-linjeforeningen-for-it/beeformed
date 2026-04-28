import path from 'path'
import { fileURLToPath } from 'url'

export default async function getFavicon(req: Request) {
    const faviconPath = path.join(process.cwd(), 'public', 'favicon.ico')
    return new Response(Bun.file(faviconPath), {
        headers: { 'Content-Type': 'image/x-icon' }
    })
}
