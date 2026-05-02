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
        <nav className='md:hidden fixed bottom-0 left-0 right-0 bg-login-900 border-t
            border-login-700 z-50 px-2 pb-[calc(0.5rem+var(--safe-area-inset-bottom))] pt-2'
        >
            <div className='flex justify-around items-center max-w-lg mx-auto'>
                {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname.startsWith(item.href)

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                                isActive ? 'text-login' : 'text-login-100 hover:text-login-50'
                            }`}
                        >
                            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            <span className='text-[10px] font-medium uppercase tracking-wider'>
                                {item.label}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
