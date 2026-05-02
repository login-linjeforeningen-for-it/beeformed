import run from '#db'
import { loadSQL } from '#utils/sql.ts'
import { checkPermission } from '#utils/permissions/checkPermissions.ts'
import { sendInternalServerError } from '#utils/http/errors.ts'
import type { AuthRequest } from '#utils/auth/authMiddleware.ts'

export default async function scanSubmission(req: AuthRequest) {
    const { id } = req.params
    if (!id) return Response.json({ error: 'id is required' }, { status: 400 })
    const { form_id } = await req.json() as { form_id: string }
    const userId = req.user.id

    if (!form_id) {
        return Response.json({ error: 'form_id is required' }, { status: 400 })
    }

    try {
        const getSql = await loadSQL('submissions/getScan.sql')
        const subRes = await run(getSql, [id])
        
        if (subRes.rows.length === 0) {
            return Response.json({ error: 'Submission not found' }, { status: 404 })
        }

        const submission = subRes.rows[0]

        if (submission.form_id !== form_id) {
            return Response.json({ error: 'This submission belongs to a different form' }, { status: 400 })
        }

        const hasPerm = await checkPermission(submission.form_id, userId, req.user.groups)

        if (!hasPerm) {
            return Response.json({ error: 'You do not have permission to scan this submission' }, { status: 403 })
        }

        if (submission.scanned_at) {
            return Response.json({
                ...submission,
                already_scanned: true
            })
        }

        const updateSql = await loadSQL('submissions/markScanned.sql')
        const result = await run(updateSql, [id])
        const newScannedAt = result.rows[0].scanned_at

        return Response.json({
            ...submission,
            already_scanned: false,
            scanned_at: newScannedAt
        })

    } catch (error) {
        return sendInternalServerError('Error scanning submission:', error)
    }
}
