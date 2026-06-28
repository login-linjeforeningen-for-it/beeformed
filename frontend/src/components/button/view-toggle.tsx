'use client'

import { Toggle } from 'uibee/components'
import { useRouter } from 'next/navigation'

type Option = { value: string; text: string; path: string }

export default function ViewToggle({ current, left, right }: { current: string; left: Option; right: Option }) {
    const router = useRouter()
    return (
        <Toggle
            value={current}
            onChange={v => router.push(v === left.value ? left.path : right.path)}
            left={{ value: left.value, text: left.text }}
            right={{ value: right.value, text: right.text }}
        />
    )
}
