export default async function getPing(req: Request) {
    return Response.json({ message: 'pong' })
}
