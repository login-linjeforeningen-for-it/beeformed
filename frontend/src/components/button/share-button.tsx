'use client'

import { Share } from 'lucide-react'
import { Button, toast } from 'uibee/components'

export default function ShareButton({ slug }: { slug: string }) {
    function handleShare() {
        const link = `${window.location.origin}/f/${slug}`
        navigator.clipboard.writeText(link)
        toast.success('Form link copied to clipboard!')
    }

    return (
        <Button
            text='Share'
            icon={<Share className='size-4' />}
            onClick={handleShare}
            variant='secondary'
        />
    )
}
