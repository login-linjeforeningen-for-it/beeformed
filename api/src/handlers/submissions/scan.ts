import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { checkPermission } from '#utils/permissions/checkPermissions.ts'
import { sendInternalServerError } from '#utils/http/errors.ts'
import { requireRouteParam } from '#utils/http/request.ts'

export default async function scanSubmission(req: FastifyRequest, res: FastifyReply) {
    const id = requireRouteParam(req, res, { error: 'id is required' })
    if (!id) return
    const { form_id } = req.body as { form_id: string }
    const userId = req.user!.id

    if (!form_id) {
        return res.status(400).send({ error: 'form_id is required' })
    }

    try {
        const getSql = await loadSQL('submissions/getScan.sql')
        const subRes = await run(getSql, [id])
        
        if (subRes.rows.length === 0) {
            return res.status(404).send({ error: 'Submission not found' })
        }

        const submission = subRes.rows[0]

        if (submission.form_id !== form_id) {
            return res.status(400).send({ error: 'This submission belongs to a different form' })
        }

        const hasPerm = await checkPermission(submission.form_id, userId, req.user!.groups)

        if (!hasPerm) {
            return res.status(403).send({ error: 'You do not have permission to scan this submission' })
        }

        if (submission.scanned_at) {
            return res.send({
                ...submission,
                already_scanned: true
            })
        }

        const updateSql = await loadSQL('submissions/markScanned.sql')
        const result = await run(updateSql, [id])
        const newScannedAt = result.rows[0].scanned_at

        return res.send({
            ...submission,
            already_scanned: false,
            scanned_at: newScannedAt
        })

    } catch (error) {
        return sendInternalServerError(res, 'Error scanning submission:', error)
    }
}
