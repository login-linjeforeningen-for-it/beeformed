import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import type { IdParams, CreateTemplateFromFormBody, SourceEntity } from '#schemas.ts'
import { runInTransaction, HttpError } from '#db'
import { loadSQL } from '#utils/db/sql.ts'

const getSourceFormSql = await loadSQL('forms/selectForDuplicate.sql')
const createTemplateSql = await loadSQL('templates/insert.sql')
const copyFieldsSql = await loadSQL('template-fields/copyByFormId.sql')
const checkSlugSql = await loadSQL('templates/checkSlug.sql')

export default async function createTemplateFromForm(
    req: AuthenticatedRequest<{ Params: IdParams; Body: CreateTemplateFromFormBody }>,
    res: FastifyReply
) {
    const createdTemplate = await runInTransaction(async (client) => {
        const sourceResult = await client.query(getSourceFormSql, [req.params.id])
        const source = sourceResult.rows[0] as SourceEntity | undefined
        if (!source) return null

        const existing = await client.query(checkSlugSql, [req.body.slug])
        if (existing.rows[0].exists) throw new HttpError(409, 'Slug is already in use')

        const createResult = await client.query(createTemplateSql, [
            req.user.id, req.params.id, req.body.slug, req.body.title, source.description, source.anonymous_submissions,
            source.limit, source.waitlist, source.multiple_submissions
        ])
        const createdTemplate = createResult.rows[0]

        await client.query(copyFieldsSql, [createdTemplate.id, req.params.id])
        return createdTemplate
    })

    if (!createdTemplate) return res.status(404).send({ error: 'Form not found' })
    return res.status(201).send(createdTemplate)
}
