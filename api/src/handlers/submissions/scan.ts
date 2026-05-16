import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import type { ScanSubmissionBody } from '#/schemas.ts'
import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { checkPermission } from '#utils/permissions/permissions.ts'
import { logError } from '#utils/logger.ts'

export default async function scanSubmission(
    req: AuthenticatedRequest<{ Params: IdParams; Body: ScanSubmissionBody }>,
    res: FastifyReply
) {
    const id = req.params.id
    const { form_id } = req.body
    const userId = req.user.id

    try {
        const getSql = await loadSQL('submissions/selectForScan.sql')
        const subRes = await run(getSql, [id])

        if (subRes.rows.length === 0) {
            return res.status(404).send({ error: 'Submission not found' })
        }

        const submission = subRes.rows[0]

        if (submission.form_id !== form_id) {
            return res.status(400).send({ error: 'This submission belongs to a different form' })
        }

        if (submission.status !== 'registered') {
            return res.status(400).send({ error: 'Only registered submissions can be scanned' })
        }

        const hasPerm = await checkPermission(submission.form_id, userId, req.user.groups)

        if (!hasPerm) {
            return res.status(403).send({ error: 'You do not have permission to scan this submission' })
        }

        const updateSql = await loadSQL('submissions/updateScanned.sql')
        const updateResult = await run(updateSql, [id])

        if (updateResult.rowCount === 0) {
            return res.send({
                ...submission,
                already_scanned: true
            })
        }

        return res.send({
            ...submission,
            already_scanned: false,
            scanned_at: updateResult.rows[0].scanned_at
        })

    } catch (error) {
        logError('Error scanning submission', {
            event: 'http.internal_error',
            requestId: req.id,
            error
        })
        return res.status(500).send({ error: 'Internal server error' })
    }
}
