import { runInTransaction } from '#db'
import { loadSQL } from '#utils/sql.ts'
import { sendInternalServerError } from '#utils/http/errors.ts'
import { hasRequiredGroup } from '#utils/validation/validators.ts'
import type { AuthRequest } from '#utils/auth/authMiddleware.ts'

type SourceForm = {
    slug: string
    title: string
    description: string | null
    anonymous_submissions: boolean
    limit: number | null
    waitlist: boolean
    multiple_submissions: boolean
    published_at: Date
    expires_at: Date
}

function buildUniqueTitle(sourceTitle: string, copyIndex: number): string {
    const baseTitle = sourceTitle.replace(/ - Copy(?: [0-9]+)?$/, '')
    return copyIndex === 1 ? `${baseTitle} - Copy` : `${baseTitle} - Copy ${copyIndex}`
}

function buildCandidateSlug(sourceSlug: string, copyIndex: number): string {
    const baseSlug = sourceSlug.replace(/-copy(?:-[0-9]+)?$/, '')
    return copyIndex === 1 ? `${baseSlug}-copy` : `${baseSlug}-copy-${copyIndex}`
}

export default async function duplicateForm(req: AuthRequest) {
    const { id, sourceFormId: sourceFormIdParam } = req.params
    const sourceFormId = id || sourceFormIdParam
    if (!sourceFormId) return Response.json({ error: 'sourceFormId is required' }, { status: 400 })
    const userId = req.user.id

    if (!hasRequiredGroup(req.user.groups, 'Aktiv')) {
        return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!userId) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const getSourceFormSql = await loadSQL('forms/getForDuplicate.sql')
        const getSourceFieldsSql = await loadSQL('form-fields/get.sql')
        const createFormSql = await loadSQL('forms/post.sql')
        const createFieldSql = await loadSQL('form-fields/post.sql')
        const checkSlugExistsSql = await loadSQL('forms/checkSlugExists.sql')

        const duplicatedForm = await runInTransaction(async (client) => {
            const sourceResult = await client.query(getSourceFormSql, [sourceFormId])
            const source = sourceResult.rows[0] as SourceForm | undefined

            if (!source) {
                return null
            }

            let copyIndex = 1
            let slug = buildCandidateSlug(source.slug, copyIndex)

            while (true) {
                const existsResult = await client.query(checkSlugExistsSql, [slug])
                const exists = existsResult.rows[0]?.exists === true
                if (!exists) break

                copyIndex += 1
                slug = buildCandidateSlug(source.slug, copyIndex)
            }

            const title = buildUniqueTitle(source.title, copyIndex)
            const formInsertParams = [
                userId,
                slug,
                title,
                source.description,
                source.anonymous_submissions,
                source.limit,
                source.waitlist,
                source.multiple_submissions,
                source.published_at,
                source.expires_at
            ]

            const createFormResult = await client.query(createFormSql, formInsertParams)
            const createdForm = createFormResult.rows[0]

            const sourceFieldsResult = await client.query(getSourceFieldsSql, [sourceFormId])
            for (const field of sourceFieldsResult.rows) {
                await client.query(createFieldSql, [
                    createdForm.id,
                    field.field_type,
                    field.title,
                    field.description,
                    field.required,
                    field.options,
                    field.validation,
                    field.field_order
                ])
            }

            return createdForm
        })

        if (!duplicatedForm) {
            return Response.json({ error: 'Form not found' }, { status: 404 })
        }

        return Response.json(duplicatedForm, { status: 201 })
    } catch (error) {
        return sendInternalServerError('Error duplicating form:', error)
    }
}