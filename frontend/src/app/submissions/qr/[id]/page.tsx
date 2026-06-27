import QRCodeGenerator from '@components/qr/generator'
import { PageContainer } from 'uibee/components'

export default async function Page({ params }: { params: Promise<{ id: string }>}) {
    const { id } = await params

    return (
        <PageContainer title='QR Code'>
            <div className='flex min-h-[60vh] flex-col items-center justify-center gap-8'>
                <div className='space-y-2 text-center'>
                    <h2 className='text-xl font-semibold text-login-100'>Scan to Check Submission</h2>
                </div>

                <div className='p-8'>
                    {id && <QRCodeGenerator data={id} size={300} />}
                </div>

                <div className='w-full max-w-xs card p-4'>
                    <p className='text-center font-mono text-xs break-all text-login-100'>
                        {id}
                    </p>
                </div>
            </div>
        </PageContainer>
    )
}
