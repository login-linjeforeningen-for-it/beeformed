import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import type { CreateOrUpdateFormBody, IdParams } from '#schemas.ts'
import config from '#constants'
import { runInTransaction, HttpError } from '#db'
import { loadSQL } from '#utils/db/sql.ts'
import { sendTypedEmail } from '#utils/email/sendSMTP.ts'
import { logError } from '#utils/logger.ts'
import { validatePublicationWindow } from '#utils/validators.ts'

const getFormSql = await loadSQL('forms/selectCreatedAtForUpdate.sql')
const countSql = await loadSQL('submissions/countRegistered.sql')
const updateSql = await loadSQL('forms/update.sql')
const waitlistSql = await loadSQL('submissions/selectWaitlistBatch.sql')
const batchUpdateStatusSql = await loadSQL('submissions/updateStatusBatch.sql')

export default async function updateForm(
    req: AuthenticatedRequest<{ Params: IdParams; Body: CreateOrUpdateFormBody }>,
    res: FastifyReply
) {
    const body = req.body
    const formId = req.params.id

    const result = await runInTransaction(async (client) => {
        const formResult = await client.query(getFormSql, [formId])
        if (formResult.rows.length === 0) {
            throw new HttpError(404, 'Form not found')
        }

        const createdAt = formResult.rows[0].created_at as Date
        const { publishedAt, expiresAt } = validatePublicationWindow(body.published_at, body.expires_at, {
            baseDate: createdAt,
            maxRangeMessage: 'expires_at cannot be more than 6 months after created_at'
        })

        const newLimit = body.limit ?? null
        const countResult = await client.query(countSql, [formId])
        const registeredCount = Number(countResult.rows[0].count)

        if (newLimit !== null && newLimit < registeredCount) {
            throw new HttpError(400, 'Limit cannot be lower than the number of registered submissions')
        }

        const putResult = await client.query(updateSql, [
            formId,
            body.slug,
            body.title,
            body.description ?? null,
            body.anonymous_submissions || false,
            newLimit,
            body.waitlist || false,
            body.multiple_submissions || false,
            publishedAt,
            expiresAt
        ])

        const updatedForm = putResult.rows[0]

        const MAX_BATCH_PROMOTION = 500
        const spotsToFill: number = newLimit === null ? MAX_BATCH_PROMOTION : Math.max(0, newLimit - registeredCount)

        const toPromote: { id: string; email: string | null }[] = []
        if (spotsToFill > 0) {
            const waitlistResult = await client.query(waitlistSql, [formId, spotsToFill])
            if (waitlistResult.rows.length > 0) {
                const ids = waitlistResult.rows.map((r: { id: string }) => r.id)
                await client.query(batchUpdateStatusSql, [ids])
                toPromote.push(...waitlistResult.rows
                    .filter((r: { email: string | null }) => r.email)
                    .map((r: { id: string; email: string }) => ({ id: r.id, email: r.email })))
            }
        }

        return { updatedForm, toPromote }
    })

    for (const person of result.toPromote) {
        try {
            await sendTypedEmail('submission', person.email!, {
                title: result.updatedForm.title,
                status: 'bumped',
                ownerEmail: result.updatedForm.creator_email || '',
                submissionId: person.id,
                actionUrl: `${config.FRONTEND_URL}/submissions/${person.id}`,
                actionText: 'View Submission'
            })
        } catch (emailError) {
            logError('Failed to send promotion email', {
                event: 'submission.promotion_email_failed',
                submissionId: person.id,
                error: emailError
            })
        }
    }

    return res.send(result.updatedForm)
}
