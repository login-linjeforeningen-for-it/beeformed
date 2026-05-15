import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import { runInTransaction } from '#db'
import { loadSQL } from '#utils/sql.ts'
import { logError } from '#utils/logger.ts'
import { hasRequiredGroup } from '#utils/validators.ts'
import { createHttpError } from '#utils/httpError.ts'

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
    const baseTitle = sourceTitle.replace(/ Template(?: [0-9]+)?$/, '')
    return copyIndex === 1 ? `${baseTitle} Template` : `${baseTitle} Template ${copyIndex}`
}

function buildCandidateSlug(sourceSlug: string, copyIndex: number): string {
    const baseSlug = sourceSlug.replace(/-template(?:-[0-9]+)?$/, '')
    return copyIndex === 1 ? `${baseSlug}-template` : `${baseSlug}-template-${copyIndex}`
}

export default async function createTemplateFromForm(
    req: AuthenticatedRequest<{ Params: IdParams }>,
    res: FastifyReply
) {
    const sourceFormId = req.params.id

    if (!hasRequiredGroup(req.user.groups, 'QueenBee')) {
        return res.status(403).send({ error: 'Forbidden' })
    }

    const userId = req.user.id

    try {
        const getSourceFormSql = await loadSQL('forms/getForDuplicate.sql')
        const getSourceFieldsSql = await loadSQL('form-fields/get.sql')
        const createTemplateSql = await loadSQL('templates/post.sql')
        const createFieldSql = await loadSQL('template-fields/post.sql')
        const checkSlugExistsSql = await loadSQL('templates/checkSlugExists.sql')

        const createdTemplate = await runInTransaction(async (client) => {
            const sourceResult = await client.query(getSourceFormSql, [sourceFormId])
            const source = sourceResult.rows[0] as SourceForm | undefined

            if (!source) {
                return null
            }

            let copyIndex = 1
            let slug = buildCandidateSlug(source.slug, copyIndex)

            while (copyIndex <= 10) {
                const existsResult = await client.query(checkSlugExistsSql, [slug])
                const exists = existsResult.rows[0]?.exists === true
                if (!exists) break

                copyIndex += 1
                slug = buildCandidateSlug(source.slug, copyIndex)
            }

            if (copyIndex > 10) {
                throw createHttpError(409, 'Could not generate a unique slug for the template')
            }

            const title = buildUniqueTitle(source.title, copyIndex)
            const templateInsertParams = [
                userId,
                sourceFormId,
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

            const createTemplateResult = await client.query(createTemplateSql, templateInsertParams)
            const createdTemplate = createTemplateResult.rows[0]

            const sourceFieldsResult = await client.query(getSourceFieldsSql, [sourceFormId])
            for (const field of sourceFieldsResult.rows) {
                await client.query(createFieldSql, [
                    createdTemplate.id,
                    field.field_type,
                    field.title,
                    field.description,
                    field.required,
                    field.options,
                    field.validation,
                    field.field_order
                ])
            }

            return createdTemplate
        })

        if (!createdTemplate) {
            return res.status(404).send({ error: 'Form not found' })
        }

        return res.status(201).send(createdTemplate)
    } catch (error: unknown) {
        const statusCode = (error as Error & { statusCode?: number }).statusCode
        if (statusCode && statusCode >= 400 && statusCode < 500) {
            return res.status(statusCode).send({ error: (error as Error).message })
        }
        logError('Error creating template from form', {
            event: 'http.internal_error',
            requestId: req.id,
            error
        })
        return res.status(500).send({ error: 'Internal server error' })
    }
}
