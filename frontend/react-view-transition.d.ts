import type { ReactNode } from 'react'

/*
 * Next 16's vendored React exposes <ViewTransition> (used with
 * experimental.viewTransition), but @types/react 19.2 does not type it yet.
 */
declare module 'react' {
    interface ViewTransitionProps {
        children?: ReactNode
        name?: string
        default?: string
        enter?: string
        exit?: string
        share?: string
        update?: string
    }
    export const ViewTransition: (props: ViewTransitionProps) => ReactNode
    export function addTransitionType(type: string): void
}
