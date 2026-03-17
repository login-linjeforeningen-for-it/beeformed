'use client'

import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'

interface QRCodeGeneratorProps {
    data: string
    size?: number
}

export default function QRCodeGenerator({ data, size = 150 }: QRCodeGeneratorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        if (!data || !canvasRef.current) return

        QRCode.toCanvas(
            canvasRef.current,
            data,
            {
                width: size,
                margin: 5,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            },
            (error) => {
                if (error) console.error('QR Code generation error:', error)
            }
        )
    }, [data, size])

    if (!data) return null

    return (
        <div className='flex flex-col items-center'>
            <canvas ref={canvasRef} className='border rounded-lg shadow-sm' />
        </div>
    )
}
