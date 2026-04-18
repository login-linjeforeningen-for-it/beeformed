'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import jsQR from 'jsqr'
import { AlertCircle, Loader2, User, Clock, CheckCircle2, XCircle, RotateCcw, ScanQrCode } from 'lucide-react'
import { scanSubmission, searchSubmissions } from '@utils/api/client'
import { useParams } from 'next/navigation'
import { formatDateTime } from '@utils/dateTime'
import { Button, PageContainer } from 'uibee/components'

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
                        <div className='absolute inset-0 p-16 pointer-events-none transition-all duration-300'>
                            <div className='w-full h-full border-2 border-login/50 rounded-lg relative'>
                                <div className='absolute -top-0.5 -left-0.5 w-6 h-6 border-t-4 border-l-4 border-login rounded-tl-sm' />
                                <div className='absolute -top-0.5 -right-0.5 w-6 h-6 border-t-4 border-r-4 border-login rounded-tr-sm' />
                                <div className='absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-4 border-l-4 border-login rounded-bl-sm' />
                                <div className='absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-4 border-r-4 border-login rounded-br-sm' />
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
                    <div className='flex flex-col items-center gap-4 w-full'>
                        <p className='text-sm text-login-300 text-center animate-pulse'>
                            Point your camera at a QR code or search for a submission below
                        </p>

                        <div className='w-full'>
                            <label className='text-xs uppercase tracking-[0.18em] text-login-500 mb-2 block'>
                                Search by name or email
                            </label>
                            <div className='flex flex-col gap-2 sm:flex-row'>
                                <input
                                    type='text'
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            handleSearch()
                                        }
                                    }}
                                    placeholder='Search submissions...'
                                    className='flex-1 rounded-2xl border border-login-800 bg-login-950 px-4 py-3
                                        text-login-50 outline-none focus:border-login focus:ring-2 focus:ring-login/30'
                                />
                                <button
                                    type='button'
                                    onClick={handleSearch}
                                    disabled={searching}
                                    className='w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-login text-sm
                                        font-semibold text-white px-4 py-3 transition hover:bg-login/90 disabled:cursor-not-allowed
                                        disabled:opacity-50 sm:w-auto'
                                >
                                    {searching ? 'Searching...' : 'Find'}
                                </button>
                            </div>

                            {searchResults.length > 0 && (
                                <div className='mt-4 space-y-2 max-h-96 overflow-y-auto w-full'>
                                    {searchResults.map(result => (
                                        <button
                                            key={result.id}
                                            type='button'
                                            onClick={() => handleSelectSubmission(result.id)}
                                            className='w-full rounded-2xl border border-login-800 bg-login-900 p-4 text-left transition
                                                hover:border-login'
                                        >
                                            <div className='flex items-center justify-between gap-2'>
                                                <div className='text-sm text-login-200'>
                                                    <div className='font-semibold text-white'>{result.user_name || 'Anonymous'}</div>
                                                    <div className='text-login-500'>{result.user_email || 'No email'}</div>
                                                </div>
                                                <span className='rounded-full bg-login-800 px-3 py-1 text-xs uppercase tracking-[0.18em]
                                                    text-login-300'
                                                >
                                                    {result.status}
                                                </span>
                                            </div>
                                            <div className='mt-2 text-xs text-login-500'>ID: {result.id}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </PageContainer>
    )
}
