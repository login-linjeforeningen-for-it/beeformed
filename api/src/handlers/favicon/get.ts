import fs from 'fs'
import path from 'path'
import type { FastifyReply, FastifyRequest } from 'fastify'

export default async function getFavicon(_req: FastifyRequest, res: FastifyReply) {
    const faviconPath = path.join(process.cwd(), 'public', 'favicon.ico')
    const icon = await fs.promises.readFile(faviconPath)
    return res.type('image/x-icon').send(icon)
}
