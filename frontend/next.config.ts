import type { NextConfig } from 'next'
import { envLoad } from 'utilbee'

envLoad({ path: '../.env' })

const nextConfig: NextConfig = {
    experimental: {
        authInterrupts: true,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 's3.login.no',
                port: '',
                pathname: '/beehive/**',
                search: '',
            }
        ],
    },
    output: 'standalone'
}

export default nextConfig
