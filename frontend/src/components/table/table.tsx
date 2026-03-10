'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronUp, ChevronDown, MoreHorizontal, Edit, Trash2, Eye, Settings, Shield, List, Share, QrCode, X } from 'lucide-react'
import { toast } from 'uibee/components'

type color = 'red' | 'green' | 'orange' | 'yellow' | 'blue' | 'gray'

type Column = {
    key: string
    label: string
    sortable?: boolean
    nullLabel?: string
    highlightColor?: color |
        ((row: Record<string, unknown>) => color | undefined)
}

type TableProps = {
    data: Record<string, unknown>[]
    columns: Column[]
    currentOrderBy?: string
    currentSort?: 'asc' | 'desc'
    onDelete?: (row: Record<string, unknown>) => void
    canDelete?: (row: Record<string, unknown>) => boolean
    onCancel?: (row: Record<string, unknown>) => void
    canCancel?: (row: Record<string, unknown>) => boolean
    disableEdit?: boolean
    viewBaseHref?: string
    viewHrefKey?: string
    showFormActions?: boolean
    customActions?: (row: Record<string, unknown>, closeMenu: () => void) => React.ReactNode
}

export default function Table({
    data,
    columns,
    currentOrderBy,
    currentSort,
    onDelete,
    canDelete,
    onCancel,
    canCancel,
    disableEdit,
    viewBaseHref,
    viewHrefKey = 'id',
    showFormActions = false,
    customActions
}: TableProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null)
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

    function handleSort(columnKey: string) {
        const params = new URLSearchParams(searchParams.toString())
        const newOrder = currentOrderBy === columnKey && currentSort === 'asc' ? 'desc' : 'asc'
        params.set('column', columnKey)
        params.set('order', newOrder)
        params.set('page', '1')
        router.push(`?${params.toString()}`)
    }

    function toggleMenu(index: number, e: React.MouseEvent) {
        e.stopPropagation()
        if (openMenuIndex === index) {
            setOpenMenuIndex(null)
            return
        }

        const rect = e.currentTarget.getBoundingClientRect()
        setMenuPosition({
            top: rect.bottom,
            left: rect.right
        })
        setOpenMenuIndex(index)
    }

    function handleEdit(row: Record<string, unknown>) {
        router.push(`/form/${row.id}`)
        setOpenMenuIndex(null)
    }

    function handleSettings(row: Record<string, unknown>) {
        router.push(`/form/${row.id}/settings`)
        setOpenMenuIndex(null)
    }

    function handlePermissions(row: Record<string, unknown>) {
        router.push(`/form/${row.id}/permissions`)
        setOpenMenuIndex(null)
    }

    function handleSubmissions(row: Record<string, unknown>) {
        router.push(`/form/${row.id}/submissions`)
        setOpenMenuIndex(null)
    }

    function handleQR(row: Record<string, unknown>) {
        router.push(`/qr/${row.id}`)
        setOpenMenuIndex(null)
    }

    function handleDelete(row: Record<string, unknown>) {
        if (onDelete) onDelete(row)
        setOpenMenuIndex(null)
    }

    function handleCancel(row: Record<string, unknown>) {
        if (onCancel) onCancel(row)
        setOpenMenuIndex(null)
    }

    function handleView(row: Record<string, unknown>) {
        if (viewBaseHref) router.push(`${viewBaseHref}${row[viewHrefKey]}`)
        setOpenMenuIndex(null)
    }

    function handleShare(row: Record<string, unknown>) {
        const slug = row.slug as string
        const link = `${window.location.origin}/f/${slug}`
        navigator.clipboard.writeText(link)
        setOpenMenuIndex(null)
        toast.success('Form link copied to clipboard!')
    }

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (hoveredIndex === null) return
            const row = data[hoveredIndex]
            if (!row) return

            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

            switch (e.key.toLowerCase()) {
                case 'e':
                    if (!disableEdit) handleEdit(row)
                    break
                case 's':
                    if (showFormActions) handleSettings(row)
                    break
                case 'p':
                    if (showFormActions) handlePermissions(row)
                    break
                case 'a':
                    if (showFormActions) handleSubmissions(row)
                    break
                case 'v':
                    if (viewBaseHref) handleView(row)
                    break
                case 'q':
                    if (showFormActions) handleQR(row)
                    break
                case 'h':
                    handleShare(row)
                    break
                case 'c':
                    if (onCancel && (!canCancel || canCancel(row))) handleCancel(row)
                    break
                case 'd':
                    if (onDelete && (!canDelete || canDelete(row))) handleDelete(row)
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [hoveredIndex, data, disableEdit, showFormActions, viewBaseHref, onDelete, canDelete, onCancel, canCancel])

    useEffect(() => {
        const handleScroll = () => {
            if (openMenuIndex !== null) setOpenMenuIndex(null)
        }
        window.addEventListener('scroll', handleScroll, true)
        window.addEventListener('resize', handleScroll)
        return () => {
            window.removeEventListener('scroll', handleScroll, true)
            window.removeEventListener('resize', handleScroll)
        }
    }, [openMenuIndex])

    useEffect(() => {
        const handleClick = () => {
            if (openMenuIndex !== null) setOpenMenuIndex(null)
        }
        window.addEventListener('click', handleClick)
        return () => window.removeEventListener('click', handleClick)
    }, [openMenuIndex])

    return (
        <div className='prose prose-login max-w-none py-4 overflow-x-auto'>
            <table className='w-full'>
                <thead>
                    <tr>
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                className={`group ${column.sortable ? 'cursor-pointer' : ''}`}
                                onClick={column.sortable ? () => handleSort(column.key) : undefined}
                            >
                                <div className='flex items-center justify-between'>
                                    <span>{column.label}</span>
                                    {column.sortable && (
                                        <span className={`transition-opacity ${
                                            currentOrderBy === column.key
                                                ? 'opacity-100'
                                                : 'opacity-40 group-hover:opacity-100'
                                        }`}>
                                            {currentOrderBy === column.key ? (
                                                currentSort === 'asc'
                                                    ? <ChevronUp className='w-4 h-4' />
                                                    : <ChevronDown className='w-4 h-4' />
                                            ) : (
                                                <ChevronDown className='w-4 h-4' />
                                            )}
                                        </span>
                                    )}
                                </div>
                            </th>
                        ))}
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, index) => (
                        <tr
                            key={index}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            {columns.map((column) => {
                                const color = typeof column.highlightColor === 'function'
                                    ? column.highlightColor(row)
                                    : column.highlightColor
                                return (
                                    <td key={column.key} className={`whitespace-nowrap ${color ? `text-${color}-500` : ''}`}>
                                        {row[column.key] == null
                                            ? (column.nullLabel ?? '')
                                            : String(row[column.key])}
                                    </td>
                                )
                            })}
                            <td className='relative'>
                                <button
                                    onClick={(e) => toggleMenu(index, e)}
                                    className='p-1 rounded hover:bg-login-500 cursor-pointer'
                                >
                                    <MoreHorizontal className='w-4 h-4' />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {openMenuIndex !== null && data[openMenuIndex] && menuPosition && typeof document !== 'undefined' && createPortal(
                <div
                    className='fixed bg-login-500 border border-login-600 rounded-lg shadow-lg z-50 overflow-hidden w-44'
                    style={{
                        top: menuPosition.top,
                        left: menuPosition.left - 176
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {!disableEdit && (
                        <button
                            onClick={() => handleEdit(data[openMenuIndex])}
                            className='flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-login-600 cursor-pointer'
                        >
                            <div className='flex items-center'>
                                <Edit className='w-4 h-4 mr-2' />
                                Edit
                            </div>
                            <span className='text-xs opacity-50 font-mono'>E</span>
                        </button>
                    )}
                    {showFormActions && (
                        <>
                            <button
                                onClick={() => handleSettings(data[openMenuIndex])}
                                className='flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-login-600 cursor-pointer'
                            >
                                <div className='flex items-center'>
                                    <Settings className='w-4 h-4 mr-2' />
                                    Settings
                                </div>
                                <span className='text-xs opacity-50 font-mono'>S</span>
                            </button>
                            <button
                                onClick={() => handlePermissions(data[openMenuIndex])}
                                className='flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-login-600 cursor-pointer'
                            >
                                <div className='flex items-center'>
                                    <Shield className='w-4 h-4 mr-2' />
                                    Permissions
                                </div>
                                <span className='text-xs opacity-50 font-mono'>P</span>
                            </button>
                            <button
                                onClick={() => handleSubmissions(data[openMenuIndex])}
                                className='flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-login-600 cursor-pointer'
                            >
                                <div className='flex items-center'>
                                    <List className='w-4 h-4 mr-2' />
                                    Submissions
                                </div>
                                <span className='text-xs opacity-50 font-mono'>A</span>
                            </button>
                            <button
                                onClick={() => handleQR(data[openMenuIndex])}
                                className='flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-login-600 cursor-pointer'
                            >
                                <div className='flex items-center'>
                                    <QrCode className='w-4 h-4 mr-2' />
                                    Scanner
                                </div>
                                <span className='text-xs opacity-50 font-mono'>Q</span>
                            </button>
                            <button
                                onClick={() => handleShare(data[openMenuIndex])}
                                className='flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-login-600 cursor-pointer'
                            >
                                <div className='flex items-center'>
                                    <Share className='w-4 h-4 mr-2' />
                                    Share
                                </div>
                                <span className='text-xs opacity-50 font-mono'>H</span>
                            </button>
                        </>
                    )}
                    {customActions && customActions(data[openMenuIndex], () => setOpenMenuIndex(null))}
                    {viewBaseHref && (
                        <button
                            onClick={() => handleView(data[openMenuIndex])}
                            className='flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-login-600 cursor-pointer'
                        >
                            <div className='flex items-center'>
                                <Eye className='w-4 h-4 mr-2' />
                                View
                            </div>
                            <span className='text-xs opacity-50 font-mono'>V</span>
                        </button>
                    )}
                    {onCancel && (!canCancel || canCancel(data[openMenuIndex])) && (
                        <button
                            onClick={() => handleCancel(data[openMenuIndex])}
                            className='flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-login-600 cursor-pointer'
                        >
                            <div className='flex items-center'>
                                <X className='w-4 h-4 mr-2' />
                                Cancel
                            </div>
                            <span className='text-xs opacity-50 font-mono'>C</span>
                        </button>
                    )}
                    {onDelete && (!canDelete || canDelete(data[openMenuIndex])) && (
                        <button
                            onClick={() => handleDelete(data[openMenuIndex])}
                            className='flex items-center justify-between w-full px-3 py-2 text-sm
                                    hover:bg-login-600 text-red-400 cursor-pointer'
                        >
                            <div className='flex items-center'>
                                <Trash2 className='w-4 h-4 mr-2' />
                                Delete
                            </div>
                            <span className='text-xs opacity-50 font-mono'>D</span>
                        </button>
                    )}
                </div>,
                document.body
            )}
        </div>
    )
}
