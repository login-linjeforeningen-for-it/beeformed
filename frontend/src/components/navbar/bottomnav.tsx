'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, FileText, LayoutTemplate, ListTodo } from 'lucide-react'

const navItems = [
    {
        label: 'Forms',
        href: '/forms',
        icon: FileText
    },
    {
        label: 'Templates',
        href: '/templates',
        icon: LayoutTemplate
    },
    {
        label: 'Submissions',
        href: '/submissions',
        icon: ListTodo
    },
    {
        label: 'Profile',
        href: '/profile',
        icon: User
    }
]

export default function BottomNav() {
    const pathname = usePathname()

    return (
        <nav className='fixed inset-x-0 bottom-0 z-50 border-t border-login-700 bg-login-900
            px-2 pt-2 pb-[calc(0.5rem+var(--safe-area-inset-bottom))] md:hidden'
        >
            <div className='mx-auto flex max-w-lg items-center justify-around'>
                {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname.startsWith(item.href)

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center gap-1 rounded-lg px-3 py-1 transition-colors ${
                                isActive ? 'text-login' : 'text-login-100 hover:text-login-50'
                            }`}
                        >
                            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            <span className='text-[10px] font-medium tracking-wider uppercase'>
                                {item.label}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
