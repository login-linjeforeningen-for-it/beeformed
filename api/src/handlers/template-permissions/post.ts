import type { FastifyReply, FastifyRequest } from 'fastify'
import run from '#db'
import { loadSQL } from '#utils/sql.ts'

export default async function createTemplatePermission(req: FastifyRequest, res: FastifyReply) {
    const body = req.body as {
        user_email?: string | null
        group?: string | null
    }
    const params = req.params as { id?: string }

    if (!body.user_email && !body.group) {
        return res.status(400).send({ error: 'At least one of user_email or group must be defined' })
    }

    if (body.user_email && body.group) {
        return res.status(400).send({ error: 'Only one of user_email or group can be defined' })
    }

    let userId = null
    if (body.user_email) {
        const userQuery = 'SELECT user_id FROM users WHERE email = $1'
        const userResult = await run(userQuery, [body.user_email])
        if (userResult.rows.length === 0) {
            return res.status(400).send({ error: 'User with this email not found' })
        }
        userId = userResult.rows[0].user_id
    }

    const templateId = params.id
    const grantedBy = req.user!.id
    const group = body.group || null
    const user_id = userId || null

    if (!templateId || !grantedBy) {
        return res.status(400).send({ error: 'template_id and granted_by are required' })
    }

    const templateCheckQuery = 'SELECT user_id FROM form_templates WHERE id = $1'
    const templateCheckResult = await run(templateCheckQuery, [templateId])
    if (templateCheckResult.rows.length === 0) {
        return res.status(404).send({ error: 'Template not found' })
    }
    if (templateCheckResult.rows[0].user_id !== grantedBy) {
        return res.status(403).send({ error: 'Forbidden' })
    }

    try {
        const sql = await loadSQL('template-permissions/post.sql')
        const result = await run(sql, [templateId, user_id, group, grantedBy])
        res.status(201).send(result.rows[0])
    } catch (error) {
        console.error('Error creating entity:', error)
        res.status(500).send({ error: 'Internal server error' })
    }
}
