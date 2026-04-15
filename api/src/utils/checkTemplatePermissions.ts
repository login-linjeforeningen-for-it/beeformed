import run from '#db'
import { loadSQL } from '#utils/sql.ts'

export async function checkTemplatePermission(templateId: string, userId: string, groups: string[] = []): Promise<boolean> {
    try {
        const sql = await loadSQL('template-permissions/checkPermission.sql')
        const result = await run(sql, [templateId, userId, groups])

        return result.rows[0]?.has_permission || false
    } catch (error) {
        console.error('Error checking template permission:', error)
        return false
    }
}
