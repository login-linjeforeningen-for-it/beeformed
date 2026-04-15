import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import { checkPermission } from '#utils/checkPermissions.ts'
import { loadSQL, buildFilteredQuery } from '#utils/sql.ts'

export default async function getSubmissionsByForm(req: FastifyRequest, res: FastifyReply) {
    const { id: formId } = req.params as { id: string }
    const userId = req.user!.id
    const query = req.query as {
        search?: string
        limit?: string
        offset?: string
        order_by?: string
        sort?: string
        include_answers?: string
    }

    try {
        const hasPermission = await checkPermission(formId, userId, req.user!.groups || [])
        if (!hasPermission) {
            return res.status(403).send({ error: 'Forbidden' })
        }

        const orderBy = query.order_by || 'submitted_at'
        const orderMap: Record<string, string> = {
            submitted_at: 's.submitted_at',
            id: 's.id',
            user_name: 'u.name',
            user_email: 'u.email',
            status: 's.status',
            scanned_at: 's.scanned_at'
        }
        if (!orderMap[orderBy]) {
            return res.status(400).send({ error: 'Invalid order_by parameter' })
        }

        const sqlFile = query.include_answers === 'true'
            ? 'submissions/getAllByFormWithAnswers.sql'
            : 'submissions/getAllByForm.sql'

        const { sql, params } = await buildFilteredQuery(
            sqlFile,
            [formId],
            query,
            undefined,
            {
                searchFields: ['u.email', 'u.name', 's.id::text'],
                explicitOrderField: orderMap[orderBy]
            }
        )
        const result = await run(sql, params)
        const data = result.rows
        const total = data.length > 0 ? (data[0] as Record<string, unknown>).total_count as number : 0

        if (query.include_answers === 'true') {
            const fieldsSql = await loadSQL('form-fields/get.sql')
            const fieldsResult = await run(fieldsSql, [formId])
            return res.send({ data, total, fields: fieldsResult.rows })
        }

        res.send({ data, total })
    } catch (error) {
        console.error('Error getting submissions:', error)
        res.status(500).send({ error: 'Internal server error' })
    }
}