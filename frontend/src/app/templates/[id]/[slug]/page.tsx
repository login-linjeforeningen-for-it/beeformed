import { redirect } from 'next/navigation'

type PageProps = {
    params: Promise<{ id: string, slug: string }>
}

export default async function Page({ params }: PageProps) {
    const { id, slug } = await params
    redirect(`/template/${id}/${slug}`)
}
