'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import jsQR from 'jsqr'
import { AlertCircle, Loader2, User, Clock, CheckCircle2, XCircle, RotateCcw, ScanQrCode } from 'lucide-react'
import { scanSubmission, searchSubmissions } from '@utils/api/client'
import { useParams } from 'next/navigation'
import { formatDateTime } from '@utils/dateTime'
import { Button, PageContainer, Input } from 'uibee/components'
import MobileCard from '@components/tables/mobile-card'
import { Search } from 'lucide-react'

export default function Page() {
    const params = useParams()
    const formIdParam = params.id
    const formId = Array.isArray(formIdParam) ? formIdParam[0] : formIdParam

    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [error, setError] = useState<string | null>(null)
    const [scannedData, setScannedData] = useState<string | null>(null)
    const [submission, setSubmission] = useState<Submission | null>(null)
    const [loadingSubmission, setLoadingSubmission] = useState(false)
    const [isScanning, setIsScanning] = useState(false)
    const [cameraError, setCameraError] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [searchResults, setSearchResults] = useState<GetSubmissionsProps['data']>([])
    const [searching, setSearching] = useState(false)
    const animationFrameId = useRef<number | null>(null)

    const stopScan = useCallback(() => {
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current)
            animationFrameId.current = null
        }

        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream
            stream.getTracks().forEach(track => track.stop())
            videoRef.current.srcObject = null
        }
        setIsScanning(false)
    }, [])

    const fetchSubmission = useCallback(async (id: string) => {
        const submissionId = id.trim()
        if (!formId || !submissionId) {
            setError('Invalid QR code or form ID')
            return
        }

        setLoadingSubmission(true)
        try {
            const result = await scanSubmission(submissionId, formId)
            setSubmission(result)
        } catch (err) {
            console.error(err)
            if (err instanceof Error) {
                setError(err.message)
            } else {
                setError('Failed to fetch submission details')
            }
        } finally {
            setLoadingSubmission(false)
        }
    }, [formId])

    const startScan = useCallback(async () => {
        setError(null)
        setSubmission(null)
        setScannedData(null)

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            })

            const video = videoRef.current
            const canvas = canvasRef.current

            if (video && canvas) {
                video.srcObject = stream
                await video.play()
                setIsScanning(true)

                const ctx = canvas.getContext('2d', { willReadFrequently: true })

                const detect = () => {
                    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
                        canvas.width = video.videoWidth
                        canvas.height = video.videoHeight

                        if (canvas.width > 0 && canvas.height > 0) {
                            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
                            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                            const code = jsQR(imageData.data, imageData.width, imageData.height)

                            if (code) {
                                const submissionId = code.data?.trim()
                                if (submissionId) {
                                    setScannedData(submissionId)
                                    stopScan()
                                    fetchSubmission(submissionId)
                                    return
                                }
                            }
                        }
                    }
                    animationFrameId.current = requestAnimationFrame(detect)
                }

                detect()
            }
        } catch (err) {
            console.error('Error accessing camera:', err)
            setError('Could not access camera. Please ensure permissions are granted.')
            setCameraError(true)
            setIsScanning(false)
        }
    }, [stopScan, fetchSubmission])

    useEffect(() => {
        if (!scannedData && !cameraError) {
            startScan()
        }
        return () => {
            stopScan()
        }
    }, [startScan, stopScan, scannedData, cameraError])

    function handleContinue() {
        setError(null)
        setScannedData(null)
        setSubmission(null)
        setCameraError(false)
    }

    function getStatusColor(status: string) {
        switch (status) {
            case 'registered': return 'text-green-500 bg-green-500/10'
            case 'waitlisted': return 'text-yellow-500 bg-yellow-500/10'
            case 'cancelled': return 'text-gray-500 bg-gray-500/10'
            case 'rejected': return 'text-red-500 bg-red-500/10'
            default: return 'text-login-200 bg-login-900'
        }
    }

    const handleSearch = useCallback(async () => {
        if (!formId) {
            setError('Invalid form ID')
            return
        }

        const term = searchTerm.trim()
        if (!term) {
            setError('Type a name or email to search')
            setSearchResults([])
            return
        }

        setError(null)
        setSearching(true)

        try {
            const result = await searchSubmissions(formId, term, 10)
            setSearchResults(result.data || [])

            if (!result.data || result.data.length === 0) {
                setError('No matching submissions found')
            }
        } catch (err) {
            console.error(err)
            if (err instanceof Error) {
                setError(err.message)
            } else {
                setError('Search failed')
            }
        } finally {
            setSearching(false)
        }
    }, [formId, searchTerm])

    async function handleSelectSubmission(submissionId: string) {
        setError(null)
        setSearchResults([])
        setScannedData(submissionId)
        await fetchSubmission(submissionId)
    }

    function getStatusIcon(status: string) {
        switch (status) {
            case 'registered': return <CheckCircle2 className='w-5 h-5' />
            case 'waitlisted': return <Clock className='w-5 h-5' />
            case 'cancelled': return <XCircle className='w-5 h-5' />
            case 'rejected': return <XCircle className='w-5 h-5' />
            default: return <AlertCircle className='w-5 h-5' />
        }
    }

    return (
        <PageContainer title='QR Scanner'>
            <canvas ref={canvasRef} className='hidden' />

            <div className='flex flex-col items-center gap-6 w-full max-w-md mx-auto'>
                <div className={`relative w-full ${!submission || loadingSubmission ? 'aspect-square' : ''} 
                    bg-login-950 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-login-800`}
                >
                    <video
                        ref={videoRef}
                        className={`absolute inset-0 w-full h-full object-cover ${scannedData ? 'hidden' : ''}`}
                        playsInline
                        muted
                    />

                    {(!isScanning && !scannedData && !error) || loadingSubmission ? (
                        <div className='absolute inset-0 flex flex-col items-center justify-center text-login-200 bg-login-950'>
                            <Loader2 className='w-8 h-8 animate-spin mb-4 text-login' />
                            <p className='text-sm font-medium'>{loadingSubmission ? 'Fetching details...' : 'Starting camera...'}</p>
                        </div>
                    ) : null}

                    {error && (
                        <div className='absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-login-50
                                        bg-login-950/95 backdrop-blur-sm z-20'
                        >
                            <div className='w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4 text-red-500'>
                                <AlertCircle className='w-6 h-6' />
                            </div>
                            <p className='text-sm text-login-200 mb-6'>{error}</p>
                            <Button
                                text='Try Again'
                                icon={<RotateCcw />}
                                onClick={() => { setError(null); setScannedData(null); setCameraError(false) }}
                                variant='secondary'
                            />
                        </div>
                    )}

                    {isScanning && !scannedData && !loadingSubmission && (
                        <div className='absolute inset-0 p-8 pointer-events-none'>
                            <div className='w-full h-full border border-login-800 rounded-[2rem] relative overflow-hidden'>
                                <div className='absolute inset-0 bg-gradient-to-b from-transparent
                                    via-login/5 to-transparent animate-scan-move' />
                                {/* Corner Accents */}
                                <div className='absolute -top-1 -left-1 w-14 h-14 border-t-4
                                    border-l-4 border-login rounded-tl-2xl' />
                                <div className='absolute -top-1 -right-1 w-14 h-14 border-t-4
                                    border-r-4 border-login rounded-tr-2xl' />
                                <div className='absolute -bottom-1 -left-1 w-14 h-14 border-b-4
                                    border-l-4 border-login rounded-bl-2xl' />
                                <div className='absolute -bottom-1 -right-1 w-14 h-14 border-b-4
                                    border-r-4 border-login rounded-br-2xl' />
                            </div>
                        </div>
                    )}

                    {submission && !loadingSubmission && (
                        <div className='relative z-10 flex flex-col items-center justify-center p-6 text-center gap-4'>
                            {submission.already_scanned ? (
                                <div className='flex flex-col items-center gap-2 mb-2 w-full'>
                                    <div className='w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center
                                                    text-yellow-500 mb-2 ring-1 ring-yellow-500/20'
                                    >
                                        <AlertCircle className='w-10 h-10' />
                                    </div>
                                    <h3 className='font-bold text-xl text-yellow-500'>
                                        Already Scanned
                                    </h3>
                                    <p className='text-login-200 text-sm'>
                                        Scanned: {formatDateTime(submission.scanned_at!)}
                                    </p>
                                </div>
                            ) : (
                                <h3 className='font-bold text-xl text-white'>
                                    Submission Scanned
                                </h3>
                            )}

                            <div className='bg-login-900 rounded-xl border border-login-800 p-4 w-full'>
                                <div className='flex items-center gap-3 text-login-100 mb-1'>
                                    <User className='w-4 h-4 text-login-400' />
                                    <span className='text-sm font-medium'>Name</span>
                                </div>
                                <p className='text-lg font-semibold text-white pl-7 text-left'>
                                    {submission.user_name || 'Anonymous'}
                                </p>
                            </div>

                            <div className='bg-login-900 rounded-xl border border-login-800 p-4 w-full'>
                                <div className='flex items-center gap-3 text-login-100 mb-2'>
                                    <Clock className='w-4 h-4 text-login-400' />
                                    <span className='text-sm font-medium'>Status</span>
                                </div>
                                <div className={`ml-7 flex w-fit gap-2 px-3 py-1.5 rounded-full text-sm font-semibold
                                    ${getStatusColor(submission.status)}`}
                                >
                                    {getStatusIcon(submission.status)}
                                    <span className='capitalize'>{submission.status}</span>
                                </div>
                            </div>

                            <Button
                                text='Scan Next'
                                icon={<ScanQrCode />}
                                variant='primary'
                                onClick={handleContinue}
                            />
                        </div>
                    )}
                </div>

                {!scannedData && !loadingSubmission && (
                    <div className='w-full space-y-6'>
                        <div className='bg-login-900 rounded-2xl p-6 border border-login-800 shadow-sm'>
                            <div className='flex flex-col gap-6'>
                                <div className='space-y-1'>
                                    <h3 className='text-sm font-semibold text-white uppercase tracking-wider'>Manual Search</h3>
                                    <p className='text-xs text-login-400'>Search for a submission if the QR code cannot be scanned.</p>
                                </div>
                                <div className='flex flex-col gap-4'>
                                    <Input
                                        name='searchTerm'
                                        value={searchTerm}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                handleSearch()
                                            }
                                        }}
                                        placeholder='Enter name or email...'
                                        icon={<Search size={18} className='text-login-400' />}
                                        className='bg-login-950 border-login-800'
                                    />
                                    <Button
                                        text={searching ? 'Searching...' : 'Search Submissions'}
                                        icon={<Search size={18} />}
                                        onClick={handleSearch}
                                        disabled={searching}
                                        variant='primary'
                                        className='w-full'
                                    />
                                </div>
                            </div>
                        </div>

                        {searchResults.length > 0 && (
                            <div className='mt-6 space-y-3 max-h-96 overflow-y-auto w-full no-scrollbar'>
                                {searchResults.map(result => (
                                    <MobileCard
                                        key={result.id}
                                        title={result.user_name || 'Anonymous'}
                                        subtitle={result.user_email || 'No email provided'}
                                        details={[{ label: 'ID', value: result.id }]}
                                        status={{
                                            label: result.status,
                                            color: result.status === 'registered' ? 'green' :
                                                result.status === 'waitlisted' ? 'yellow' :
                                                    result.status === 'rejected' ? 'red' : 'gray'
                                        }}
                                        onClick={() => handleSelectSubmission(result.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </PageContainer>
    )
}
