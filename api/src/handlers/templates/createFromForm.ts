import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import { runInTransaction } from '#db'
import { loadSQL } from '#utils/sql.ts'
import { logError } from '#utils/logger.ts'
import { hasRequiredGroup } from '#utils/validators.ts'
import { buildUniqueTitle, findUniqueSlug, copyFieldsToTarget, type SourceEntity } from '#utils/duplicate.ts'

export default async function createTemplateFromForm(
    req: AuthenticatedRequest<{ Params: IdParams }>,
    res: FastifyReply
) {
    if (!hasRequiredGroup(req.user.groups, 'QueenBee')) {
        return res.status(403).send({ error: 'Forbidden' })
    }

    const sourceFormId = req.params.id
    const userId = req.user.id

    try {
        const getSourceFormSql = await loadSQL('forms/selectForDuplicate.sql')
        const getSourceFieldsSql = await loadSQL('form-fields/selectByForm.sql')
        const createTemplateSql = await loadSQL('templates/insert.sql')
        const createFieldSql = await loadSQL('template-fields/insert.sql')
        const checkSlugExistsSql = await loadSQL('templates/checkSlug.sql')

        const createdTemplate = await runInTransaction(async (client) => {
            const sourceResult = await client.query(getSourceFormSql, [sourceFormId])
            const source = sourceResult.rows[0] as SourceEntity | undefined
            if (!source) return null

            const { slug, copyIndex } = await findUniqueSlug(
                client, checkSlugExistsSql, source.slug, 'template',
                'Could not generate a unique slug for the template'
            )
            const title = buildUniqueTitle(source.title, copyIndex, 'Template')

            const createTemplateResult = await client.query(createTemplateSql, [
                userId, sourceFormId, slug, title, source.description, source.anonymous_submissions,
                source.limit, source.waitlist, source.multiple_submissions, source.published_at, source.expires_at
            ])
            const createdTemplate = createTemplateResult.rows[0]

            await copyFieldsToTarget(client, getSourceFieldsSql, createFieldSql, sourceFormId, createdTemplate.id)
            return createdTemplate
        })

        if (!createdTemplate) return res.status(404).send({ error: 'Form not found' })
        return res.status(201).send(createdTemplate)
    } catch (error: unknown) {
        const err = error as Error & { statusCode?: number; code?: string }
        if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
            return res.status(err.statusCode).send({ error: err.message })
        }
        if (err.code === '23505') return res.status(409).send({ error: 'Slug is already taken' })
        logError('Error creating template from form', { event: 'http.internal_error', requestId: req.id, error })
        return res.status(500).send({ error: 'Internal server error' })
    }
}
