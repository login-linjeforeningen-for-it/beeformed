import type { FastifyReply, FastifyRequest } from 'fastify'
import { runInTransaction } from '#db'
import { loadSQL } from '#utils/sql.ts'
import { sendInternalServerError } from '#utils/http/errors.ts'
import { hasRequiredGroup } from '#utils/validation/validators.ts'
import { requireRouteParam } from '#utils/http/request.ts'

type SourceTemplate = {
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

export default async function createFormFromTemplate(req: FastifyRequest, res: FastifyReply) {
    const sourceTemplateId = requireRouteParam(req, res, { error: 'Template id is required' })
    if (!sourceTemplateId) return
    const userId = req.user?.id

    if (req.user?.groups && !hasRequiredGroup(req.user.groups, 'QueenBee')) {
        return res.status(403).send({ error: 'Forbidden' })
    }

    if (!userId) {
        return res.status(401).send({ error: 'Unauthorized' })
    }

    try {
        const getSourceTemplateSql = await loadSQL('templates/getForDuplicate.sql')
        const getSourceFieldsSql = await loadSQL('template-fields/get.sql')
        const createFormSql = await loadSQL('forms/post.sql')
        const createFieldSql = await loadSQL('form-fields/post.sql')
        const checkSlugExistsSql = await loadSQL('forms/checkSlugExists.sql')

        const createdForm = await runInTransaction(async (client) => {
            const sourceResult = await client.query(getSourceTemplateSql, [sourceTemplateId])
            const source = sourceResult.rows[0] as SourceTemplate | undefined

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

            const sourceFieldsResult = await client.query(getSourceFieldsSql, [sourceTemplateId])
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

        if (!createdForm) {
            return res.status(404).send({ error: 'Template not found' })
        }

        res.status(201).send(createdForm)
    } catch (error) {
        return sendInternalServerError(res, 'Error creating form from template:', error)
    }
}
