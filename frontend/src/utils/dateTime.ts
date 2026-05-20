// Convert datetime-local string (YYYY-MM-DDTHH:mm) to ISO with local offset.
// Must use the local string directly — not toISOString() which is UTC.
export function toISOWithOffset(localDatetime: string): string {
    const date = new Date(localDatetime)
    const offset = -date.getTimezoneOffset()
    const sign = offset >= 0 ? '+' : '-'
    const abs = Math.abs(offset)
    const hh = String(Math.floor(abs / 60)).padStart(2, '0')
    const mm = String(abs % 60).padStart(2, '0')
    const withSeconds = localDatetime.length === 16 ? `${localDatetime}:00` : localDatetime
    return `${withSeconds}${sign}${hh}:${mm}`
}

// Format a UTC date (from API) to YYYY-MM-DDTHH:mm in local time for datetime-local inputs.
export function toDateTimeLocal(date: Date | string): string {
    const d = new Date(date)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function formatDateTime(date: Date | string, locale: string = 'no-NB', options?: Intl.DateTimeFormatOptions): string {
    return new Date(date).toLocaleString(locale, options || {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    })
}
