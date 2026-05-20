import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import type { IdParams, DuplicateFormBody, SourceEntity } from '#schemas.ts'
import { runInTransaction, HttpError } from '#db'
import { loadSQL } from '#utils/db/sql.ts'
import { validatePublicationWindow } from '#utils/validators.ts'

const getSourceFormSql = await loadSQL('forms/selectForDuplicate.sql')
const createFormSql = await loadSQL('forms/insert.sql')
const copyFieldsSql = await loadSQL('form-fields/copyByFormId.sql')
const checkSlugSql = await loadSQL('forms/checkSlug.sql')

export default async function duplicateForm(
    req: AuthenticatedRequest<{ Params: IdParams; Body: DuplicateFormBody }>,
    res: FastifyReply
) {
    const { publishedAt, expiresAt } = validatePublicationWindow(req.body.published_at, req.body.expires_at)

    const duplicatedForm = await runInTransaction(async (client) => {
        const sourceResult = await client.query(getSourceFormSql, [req.params.id])
        const source = sourceResult.rows[0] as SourceEntity | undefined
        if (!source) return null

        const existing = await client.query(checkSlugSql, [req.body.slug])
        if (existing.rows[0].exists) throw new HttpError(409, 'Slug is already in use')

        const createResult = await client.query(createFormSql, [
            req.user.id, req.body.slug, req.body.title, source.description, source.anonymous_submissions,
            source.limit, source.waitlist, source.multiple_submissions, publishedAt, expiresAt
        ])
        const createdForm = createResult.rows[0]

        await client.query(copyFieldsSql, [createdForm.id, req.params.id])
        return createdForm
    })

    if (!duplicatedForm) return res.status(404).send({ error: 'Form not found' })
    return res.status(201).send(duplicatedForm)
}
