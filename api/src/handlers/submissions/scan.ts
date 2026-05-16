import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import type { ScanSubmissionBody } from '#/schemas.ts'
import { runInTransaction } from '#db'
import { loadSQL } from '#utils/sql.ts'
import { logError } from '#utils/logger.ts'

export default async function scanSubmission(
    req: AuthenticatedRequest<{ Params: IdParams; Body: ScanSubmissionBody }>,
    res: FastifyReply
) {
    const id = req.params.id
    const { form_id } = req.body

    try {
        const result = await runInTransaction(async (client) => {
            const getSql = await loadSQL('submissions/selectForScan.sql')
            const subRes = await client.query(getSql, [id, req.user.id, req.user.groups])

            if (subRes.rows.length === 0) {
                throw Object.assign(new Error('Submission not found'), { statusCode: 404 })
            }

            const { has_permission, ...submission } = subRes.rows[0]

            if (!has_permission) {
                throw Object.assign(new Error('You do not have permission to scan this submission'), { statusCode: 403 })
            }

            if (submission.form_id !== form_id) {
                throw Object.assign(new Error('This submission belongs to a different form'), { statusCode: 400 })
            }

            if (submission.status !== 'registered') {
                throw Object.assign(new Error('Only registered submissions can be scanned'), { statusCode: 400 })
            }

            const updateSql = await loadSQL('submissions/updateScanned.sql')
            const updateResult = await client.query(updateSql, [id])

            return { submission, alreadyScanned: (updateResult.rowCount ?? 0) === 0, scannedAt: updateResult.rows[0]?.scanned_at }
        })

        if (result.alreadyScanned) {
            return res.send({ ...result.submission, already_scanned: true })
        }

        return res.send({ ...result.submission, already_scanned: false, scanned_at: result.scannedAt })

    } catch (error) {
        const statusCode = (error as Error & { statusCode?: number }).statusCode
        if (statusCode) {
            return res.status(statusCode).send({ error: (error as Error).message })
        }
        logError('Error scanning submission', {
            event: 'http.internal_error',
            requestId: req.id,
            error
        })
        return res.status(500).send({ error: 'Internal server error' })
    }
}
