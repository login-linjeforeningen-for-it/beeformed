import config from '@config'
import { NextRequest } from 'next/server'
import { authToken } from 'uibee/utils'

export async function GET(request: NextRequest) {
    const url = new URL(request.url)
    const access_token = url.searchParams.get('access_token')
    const id = url.searchParams.get('id')

    fetch(`${config.url.api}/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access_token}`
        },
        body: JSON.stringify({
            user_id: id,
        })
    })

    return await authToken({
        req: request,
        redirectPath: '/'
    })
}
