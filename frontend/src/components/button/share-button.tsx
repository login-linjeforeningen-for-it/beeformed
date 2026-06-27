'use client'

import { Share } from 'lucide-react'
import { toast } from 'uibee/components'

export default function ShareButton({ slug }: { slug: string }) {
    function handleShare() {
        const link = `${window.location.origin}/f/${slug}`
        navigator.clipboard.writeText(link)
        toast.success('Form link copied to clipboard!')
    }

    return (
        <button
            onClick={handleShare}
            className='flex min-h-11 cursor-pointer items-center rounded bg-login-700
                px-4 py-3 text-login-100 transition-colors hover:bg-login-600'
        >
            <Share className='mr-2 size-4' />
            Share
        </button>
    )
}
