import { NextRequest } from 'next/server'
import { authLogout } from 'uibee/utils'

export async function GET(request: NextRequest) {
    return await authLogout({
        req: request,
    })
}
