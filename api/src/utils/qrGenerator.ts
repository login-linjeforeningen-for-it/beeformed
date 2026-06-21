import QRCode from 'qrcode'
import { logError } from '#utils/logger.ts'

export type GeneratedQRCode = {
    pngBuffer: Buffer
    pngDataUrl: string
}

export async function generateQRCodeImage({ data }: { data: string }): Promise<GeneratedQRCode | null> {
    if (!data) return null

    try {
        const options = {
            errorCorrectionLevel: 'M' as const,
            margin: 5,
            width: 320,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        }

        const [pngBuffer, pngDataUrl] = await Promise.all([
            QRCode.toBuffer(data, options),
            QRCode.toDataURL(data, options)
        ])

        return {
            pngBuffer,
            pngDataUrl
        }
    } catch (error) {
        logError('QR Code image generation error', {
            event: 'qr.generate_failed',
            error
        })
        return null
    }
}
