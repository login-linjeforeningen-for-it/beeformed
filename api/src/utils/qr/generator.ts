import QRCode from 'qrcode'
import { logUtilityError } from '#utils/http/errors.ts'

export type GeneratedQRCode = {
    pngBuffer: Buffer
    pngDataUrl: string
    svg: string
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

        const [pngBuffer, pngDataUrl, svg] = await Promise.all([
            QRCode.toBuffer(data, options),
            QRCode.toDataURL(data, options),
            QRCode.toString(data, { ...options, type: 'svg' })
        ])

        return {
            pngBuffer,
            pngDataUrl,
            svg
        }
    } catch (error) {
        logUtilityError('QR Code image generation error:', error)
        return null
    }
}
