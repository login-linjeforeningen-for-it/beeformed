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
            className='md:hidden fixed right-6 bottom-24 bg-login text-login-900 rounded-full p-4
                shadow-lg shadow-login/20 hover:scale-105 active:scale-95 transition-all z-40'
            aria-label={label || 'Create'}
        >
            <div className='flex items-center justify-center'>
                {icon}
            </div>
        </Link>
    )
}
