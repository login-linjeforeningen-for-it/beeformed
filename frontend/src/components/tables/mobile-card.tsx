'use client'

import React from 'react'

interface MobileCardProps {
    title: string
    subtitle?: string
    status?: {
        label: string
        color?: 'green' | 'yellow' | 'gray' | 'red' | 'blue'
    }
    details?: { label: string; value: string }[]
    actions?: React.ReactNode
    onClick?: () => void
}

export default function MobileCard({ title, subtitle, status, details, actions, onClick }: MobileCardProps) {
    const statusColors = {
        green: 'bg-green-500/10 text-green-400 border-green-500/20',
        yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        gray: 'bg-login-600 text-login-100 border-login-500',
        red: 'bg-red-500/10 text-red-400 border-red-500/20',
        blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    }

    return (
        <div
            onClick={onClick}
            className={`mb-3 card p-4 transition-colors active:bg-login-500 ${
                onClick ? 'cursor-pointer' : ''}`}
        >
            <div className='mb-3 flex items-start justify-between'>
                <div className='min-w-0 flex-1'>
                    <h3 className='truncate text-lg font-semibold text-login-50'>{title}</h3>
                    {subtitle && <p className='truncate text-sm text-login-100'>{subtitle}</p>}
                </div>
                {actions && (
                    <div className='ml-2 flex items-center' onClick={(e) => e.stopPropagation()}>
                        {actions}
                    </div>
                )}
            </div>

            <div className='mt-4 flex flex-wrap items-center justify-between gap-3'>
                <div className='flex flex-col gap-1'>
                    {details?.map((detail, i) => (
                        <div key={i} className='flex gap-2 text-xs'>
                            <span className='text-login-200'>{detail.label}:</span>
                            <span className='font-medium text-login-50'>{detail.value}</span>
                        </div>
                    ))}
                </div>
                {status && (
                    <span className={`rounded-full border px-3 py-1 text-[11px] font-bold tracking-wider uppercase ${
                        statusColors[status.color || 'gray']}`}>
                        {status.label}
                    </span>
                )}
            </div>
        </div>
    )
}
