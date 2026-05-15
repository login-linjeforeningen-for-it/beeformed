import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import config from '#constants'
import { runInTransaction } from '#db'
import { loadSQL } from '#utils/sql.ts'
import { sendTypedEmail } from '#utils/email/sendSMTP.ts'
import { logError } from '#utils/logger.ts'
import { isValidSlug, validatePublicationWindow, validateLengths, MAX_SLUG_LENGTH, MAX_TITLE_LENGTH, MAX_DESCRIPTION_LENGTH } from '#utils/validators.ts'
import { createHttpError } from '#utils/httpError.ts'

export default async function updateForm(
    req: AuthenticatedRequest<{ Params: IdParams; Body: CreateOrUpdateFormBody }>,
    res: FastifyReply
) {
    const body = req.body
    const formId = req.params.id

    if (!body.slug || !body.title || !body.published_at || !body.expires_at) {
        return res.status(400).send({ error: 'slug, title, published_at and expires_at are required' })
    }

    if (!isValidSlug(body.slug)) {
        return res.status(400).send({ error: 'Slug can only contain lowercase letters, numbers, hyphens, and underscores' })
    }

    const lengthError = validateLengths([
        { value: body.slug,        max: MAX_SLUG_LENGTH,        label: 'slug' },
        { value: body.title,       max: MAX_TITLE_LENGTH,       label: 'title' },
        { value: body.description, max: MAX_DESCRIPTION_LENGTH, label: 'description' },
    ])
    if (lengthError) return res.status(400).send({ error: lengthError })

    try {
        const result = await runInTransaction(async (client) => {
            const formResult = await client.query('SELECT created_at FROM forms WHERE id = $1 FOR UPDATE', [formId])
            if (formResult.rows.length === 0) {
                throw createHttpError(404, 'Entity not found')
            }

            const createdAt = formResult.rows[0].created_at as Date
            const publicationWindow = validatePublicationWindow(body.published_at, body.expires_at, {
                baseDate: createdAt,
                maxRangeMonths: 6,
                maxRangeMessage: 'expires_at cannot be more than 6 months after created_at'
            })

            if (!publicationWindow.valid) {
                throw createHttpError(400, publicationWindow.error ?? 'Invalid publication window')
            }

            const { publishedAt, expiresAt } = publicationWindow

            const newLimit = body.limit ? Number(body.limit) : null
            const countSql = await loadSQL('submissions/countRegistered.sql')
            const countResult = await client.query(countSql, [formId])
            const registeredCount = Number(countResult.rows[0].count)

            if (newLimit !== null && newLimit < registeredCount) {
                throw createHttpError(400, 'Limit cannot be lower than the number of registered submissions')
            }

            const sqlParams = [
                formId,
                body.slug,
                body.title,
                body.description || null,
                body.anonymous_submissions || false,
                newLimit,
                body.waitlist || false,
                body.multiple_submissions || false,
                publishedAt,
                expiresAt
            ]
            const putSql = await loadSQL('forms/put.sql')
            const putResult = await client.query(putSql, sqlParams)

            if (putResult.rows.length === 0) {
                throw createHttpError(404, 'Entity not found')
            }

            const updatedForm = putResult.rows[0]

            let spotsToFill: number | null = 0
            if (newLimit === null) {
                spotsToFill = null
            } else {
                spotsToFill = Math.max(0, newLimit - registeredCount)
            }

            const toPromote: { id: string; email: string | null }[] = []
            if (spotsToFill === null || spotsToFill > 0) {
                const getWaitlistSql = await loadSQL('submissions/getWaitlistBatch.sql')
                const updateStatusSql = await loadSQL('submissions/updateStatus.sql')

                const waitlistResult = await client.query(getWaitlistSql, [formId, spotsToFill])
                const waitlistedRows = waitlistResult.rows

                for (const submission of waitlistedRows) {
                    await client.query(updateStatusSql, [submission.id, 'registered'])
                    if (submission.email) {
                        toPromote.push({ id: submission.id, email: submission.email })
                    }
                }
            }

            return { updatedForm, toPromote }
        })

        const { updatedForm, toPromote } = result

        for (const person of toPromote) {
            await sendTypedEmail('submission', person.email!, {
                title: updatedForm.title,
                status: 'bumped',
                ownerEmail: updatedForm.creator_email || '',
                submissionId: person.id,
                actionUrl: `${config.FRONTEND_URL}/submissions/${person.id}`,
                actionText: 'View Submission'
            })
        }

        return res.send(updatedForm)
    } catch (error: unknown) {
        const err = error as Error & { statusCode?: number }
        if (err.statusCode) {
            return res.status(err.statusCode).send({ error: err.message })
        }
        logError('Error updating entity', {
            event: 'http.internal_error',
            requestId: req.id,
            error
        })
        return res.status(500).send({ error: 'Internal server error' })
    }
}
