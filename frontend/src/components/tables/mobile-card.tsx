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
            className={`p-4 mb-3 bg-login-700 border border-login-600 rounded-xl active:bg-login-600 transition-colors ${
                onClick ? 'cursor-pointer' : ''}`}
        >
            <div className='flex justify-between items-start mb-3'>
                <div className='flex-1 min-w-0'>
                    <h3 className='text-lg font-semibold text-login-50 truncate'>{title}</h3>
                    {subtitle && <p className='text-sm text-login-200 truncate'>{subtitle}</p>}
                </div>
                {actions && (
                    <div className='flex items-center ml-2' onClick={(e) => e.stopPropagation()}>
                        {actions}
                    </div>
                )}
            </div>

            <div className='flex flex-wrap items-center justify-between gap-3 mt-4'>
                <div className='flex flex-col gap-1'>
                    {details?.map((detail, i) => (
                        <div key={i} className='flex gap-2 text-xs'>
                            <span className='text-login-300'>{detail.label}:</span>
                            <span className='text-login-100 font-medium'>{detail.value}</span>
                        </div>
                    ))}
                </div>
                {status && (
                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                        statusColors[status.color || 'gray']}`}>
                        {status.label}
                    </span>
                )}
            </div>
        </div>
    )
}
