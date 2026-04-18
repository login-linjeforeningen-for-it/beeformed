import { FilterProps } from '../types'

export function buildFilterQuery({ search, offset, limit, orderBy, sort, includeAnswers }: FilterProps = {}): string {
    const queryParts = new URLSearchParams()

    if (search) queryParts.append('search', String(search))
    if (limit !== undefined) queryParts.append('limit', String(limit))
    if (offset !== undefined) queryParts.append('offset', String(offset))
    if (orderBy) queryParts.append('order_by', String(orderBy))
    if (sort) queryParts.append('sort', String(sort))
    if (includeAnswers) queryParts.append('include_answers', 'true')

    return queryParts.toString()
}
