import config from '#constants'

type CheckTokenResponse = {
    valid: boolean
    userInfo?: {
        sub: string
        name: string
        email: string
        groups?: string[]
    }
    error?: string
}

export default async function checkToken( req: Request ): Promise<CheckTokenResponse> {
    const { USERINFO_URL } = config
    const authHeader = req.headers.get('authorization')

    if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
        return {
            valid: false,
            error: 'Missing or invalid Authorization header'
        }
    }

    const token = authHeader.split(' ')[1]

    try {
        const userInfoRes = await fetch(USERINFO_URL, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        if (!userInfoRes.ok) {
            return {
                valid: false,
                error: 'Unauthorized'
            }
        }

        const userInfo = await userInfoRes.json()

        return {
            valid: true,
            userInfo: userInfo as any
        }
    } catch (err) {
        console.error(err)
        return {
            valid: false,
            error: 'Internal server error'
        }
    }
}
