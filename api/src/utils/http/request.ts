export function getRouteParam(req: Request, keys: string[]): string | undefined {
    const params = (req as any).params as Record<string, string | undefined>
    return keys.map((key) => params[key]).find((value) => Boolean(value))
}
