import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import { runInTransaction } from '#db'
import { loadSQL } from '#utils/sql.ts'
import { logError } from '#utils/logger.ts'
import { hasRequiredGroup } from '#utils/validators.ts'
import { buildUniqueTitle, findUniqueSlug, copyFieldsToTarget, type SourceEntity } from '#utils/duplicate.ts'

export default async function createFormFromTemplate(
    req: AuthenticatedRequest<{ Params: IdParams }>,
    res: FastifyReply
) {
    if (!hasRequiredGroup(req.user.groups, 'QueenBee')) {
        return res.status(403).send({ error: 'Forbidden' })
    }

    const sourceTemplateId = req.params.id
    const userId = req.user.id

    try {
        const getSourceTemplateSql = await loadSQL('templates/selectForDuplicate.sql')
        const getSourceFieldsSql = await loadSQL('template-fields/selectByTemplate.sql')
        const createFormSql = await loadSQL('forms/insert.sql')
        const createFieldSql = await loadSQL('form-fields/insert.sql')
        const checkSlugExistsSql = await loadSQL('forms/checkSlug.sql')

        const createdForm = await runInTransaction(async (client) => {
            const sourceResult = await client.query(getSourceTemplateSql, [sourceTemplateId])
            const source = sourceResult.rows[0] as SourceEntity | undefined
            if (!source) return null

            const { slug, copyIndex } = await findUniqueSlug(
                client, checkSlugExistsSql, source.slug, 'copy',
                'Could not generate a unique slug for the form'
            )
            const title = buildUniqueTitle(source.title, copyIndex, '- Copy')

            const createFormResult = await client.query(createFormSql, [
                userId, slug, title, source.description, source.anonymous_submissions,
                source.limit, source.waitlist, source.multiple_submissions, source.published_at, source.expires_at
            ])
            const createdForm = createFormResult.rows[0]

            await copyFieldsToTarget(client, getSourceFieldsSql, createFieldSql, sourceTemplateId, createdForm.id)
            return createdForm
        })

        if (!createdForm) return res.status(404).send({ error: 'Template not found' })
        return res.status(201).send(createdForm)
    } catch (error: unknown) {
        const err = error as Error & { statusCode?: number; code?: string }
        if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
            return res.status(err.statusCode).send({ error: err.message })
        }
        if (err.code === '23505') return res.status(409).send({ error: 'Slug is already taken' })
        logError('Error creating form from template', { event: 'http.internal_error', requestId: req.id, error })
        return res.status(500).send({ error: 'Internal server error' })
    }
}
