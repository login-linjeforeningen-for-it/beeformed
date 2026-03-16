'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'

interface SearchInputProps {
    placeholder?: string
}

export default function SearchInput({ placeholder = 'Search...' }: SearchInputProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [searchValue, setSearchValue] = useState(searchParams.get('q') || '')

    useEffect(() => {
        const currentQ = searchParams.get('q') || ''
        setSearchValue(currentQ)
    }, [searchParams])

    function handleSearch(value: string) {
        setSearchValue(value)
        const params = new URLSearchParams(searchParams.toString())
        if (value.trim()) {
            params.set('q', value.trim())
        } else {
            params.delete('q')
        }
        params.delete('page')
        router.push(`${pathname}?${params.toString()}`)
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') {
            handleSearch(searchValue)
        }
    }

    return (
        <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5' />
            <input
                type='text'
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => handleSearch(searchValue)}
                placeholder={placeholder}
                className='pl-10 pr-4 py-2 border-b outline-none w-64'
            />
        </div>
    )
}
