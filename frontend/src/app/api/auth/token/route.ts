import config from '@config'
import { NextRequest } from 'next/server'
import { authToken } from 'uibee/utils'

export async function GET(request: NextRequest) {
    const url = new URL(request.url)
    const access_token = url.searchParams.get('access_token')
    const id = url.searchParams.get('id')

    if (!access_token || !id) {
        return Response.json({ error: 'Missing token or user ID' }, { status: 400 })
    }

    try {
        const provisionResponse = await fetch(`${config.url.api}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${access_token}`
            },
            body: JSON.stringify({
                user_id: id
            })
        })

        if (!provisionResponse.ok && provisionResponse.status !== 409) {
            console.error('User provisioning failed', {
                status: provisionResponse.status,
                userId: id
            })
            return Response.json({ error: 'Unable to complete sign-in setup. Please try again.' }, { status: 502 })
        }
    } catch (error) {
        console.error('User provisioning request failed', { error, userId: id })
        return Response.json({ error: 'Unable to complete sign-in setup. Please try again.' }, { status: 502 })
    }

    return await authToken({
        req: request,
        redirectPath: '/'
    })
}
