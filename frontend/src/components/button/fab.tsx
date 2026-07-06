'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'

interface FABProps {
    href: string
    icon?: React.ReactNode
    label?: string
}

export default function FAB({ href, icon = <Plus size={28} />, label }: FABProps) {
    return (
        <Link
            href={href}
            className='fixed right-6 z-40 rounded-full bg-login p-4 text-white
                shadow-lg shadow-login/20 transition-all hover:scale-105 active:scale-95 md:hidden'
            style={{
                bottom: 'calc(6rem + env(safe-area-inset-bottom, 0px))',
                viewTransitionName: 'fab',
            }}
            aria-label={label || 'Create'}
        >
            <div className='flex items-center justify-center'>
                {icon}
            </div>
        </Link>
    )
}
