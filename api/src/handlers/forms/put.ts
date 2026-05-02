import config from '#constants'
import { runInTransaction } from '#db'
import { loadSQL } from '#utils/sql.ts'
import { sendTemplatedMail } from '#utils/email/sendSMTP.ts'
import { sendInternalServerError } from '#utils/http/errors.ts'
import { isValidSlug, validatePublicationWindow } from '#utils/validation/validators.ts'
import type { AuthRequest } from '#utils/auth/authMiddleware.ts'

export default async function updateForm(req: AuthRequest) {
    const body = await req.json() as any
    const { params } = req

    if (!body.slug || !body.title || !body.published_at || !body.expires_at) {
        return Response.json({ error: 'slug, title, published_at and expires_at are required' }, { status: 400 })
    }

    if (!isValidSlug(body.slug)) {
        return Response.json({ error: 'Slug can only contain lowercase letters, numbers, hyphens, and underscores' }, { status: 400 })
    }

    const publicationWindow = validatePublicationWindow(body.published_at, body.expires_at)
    if (!publicationWindow.valid) {
        return Response.json({ error: publicationWindow.error }, { status: 400 })
    }

    const { publishedAt, expiresAt } = publicationWindow

    try {
        const result = await runInTransaction(async (client) => {
            await client.query('SELECT 1 FROM forms WHERE id = $1 FOR UPDATE', [params.id])

            const newLimit = body.limit ? Number(body.limit) : null
            const countSql = await loadSQL('submissions/countRegistered.sql')
            const countResult = await client.query(countSql, [params.id])
            const registeredCount = Number(countResult.rows[0].count)

            if (newLimit !== null && newLimit < registeredCount) {
                const error = new Error('Limit cannot be lower than the number of registered submissions')
                    ; (error as any).statusCode = 400
                throw error
            }

            const sqlParams = [
                params.id,
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
                const error = new Error('Entity not found')
                    ; (error as any).statusCode = 404
                throw error
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

                const waitlistResult = await client.query(getWaitlistSql, [params.id, spotsToFill])
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
            await sendTemplatedMail(person.email!, {
                title: updatedForm.title,
                status: 'bumped',
                ownerEmail: body.owner_email,
                submissionId: person.id,
                actionUrl: `${config.FRONTEND_URL}/submissions/${person.id}`,
                actionText: 'View Submission'
            })
        }

        return Response.json(updatedForm)
    } catch (error: any) {
        if (error.statusCode) {
            return Response.json({ error: error.message }, { status: error.statusCode })
        }
        return sendInternalServerError('Error updating entity:', error)
    }
}