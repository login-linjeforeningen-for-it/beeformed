import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '#utils/auth/authMiddleware.ts'
import type { ScanParams } from '#schemas.ts'
import { runInTransaction, HttpError } from '#db'
import { loadSQL } from '#utils/db/sql.ts'

const selectSql = await loadSQL('submissions/selectForScan.sql')
const updateSql = await loadSQL('submissions/updateScanned.sql')

export default async function scanSubmission(
    req: AuthenticatedRequest<{ Params: ScanParams }>,
    res: FastifyReply
) {
    const result = await runInTransaction(async (client) => {
        const subRes = await client.query(selectSql, [req.params.submissionId, req.params.id])
        if (subRes.rows.length === 0) throw new HttpError(404, 'Submission not found')

        const submission = subRes.rows[0]
        if (submission.status !== 'registered') throw new HttpError(400, 'Only registered submissions can be scanned')

        const updateResult = await client.query(updateSql, [req.params.submissionId])
        return { submission, alreadyScanned: (updateResult.rowCount ?? 0) === 0, scannedAt: updateResult.rows[0]?.scanned_at }
    })

    if (result.alreadyScanned) return res.send({ ...result.submission, already_scanned: true })
    return res.send({ ...result.submission, already_scanned: false, scanned_at: result.scannedAt })
}
