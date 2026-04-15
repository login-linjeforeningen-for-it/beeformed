import run from '#db'
import { loadSQL } from '#utils/sql.ts'

export async function checkPermission(formId: string, userId: string, groups: string[] = []): Promise<boolean> {
    try {
        const sql = await loadSQL('form-permissions/checkPermission.sql')
        const result = await run(sql, [formId, userId, groups])

        return result.rows[0]?.has_permission || false
    } catch (error) {
        console.error('Error checking permission:', error)
        return false
    }
}
