import pg from 'pg'
import config from '#constants'
import { logError } from '#utils/logger.ts'

const {
    DB,
    DB_USER,
    DB_HOST,
    DB_PASSWORD,
    DB_PORT,
    DB_MAX_CONN,
    DB_IDLE_TIMEOUT_MS,
    DB_TIMEOUT_MS
} = config
const { Pool } = pg
const pool = new Pool({
    user: DB_USER,
    host: DB_HOST,
    database: DB,
    password: DB_PASSWORD,
    port: DB_PORT,
    max: DB_MAX_CONN,
    idleTimeoutMillis: DB_IDLE_TIMEOUT_MS,
    connectionTimeoutMillis: DB_TIMEOUT_MS,
    keepAlive: true
})

pool.on('error', (err) => logError('Unexpected DB pool error', { event: 'db.pool_error', error: err }))

export default async function run(query: string, params?: SQLParamType[]): Promise<pg.QueryResult> {
    return pool.query(query, params ?? [])
}

export async function runInTransaction<T>(callback: (client: pg.PoolClient) => Promise<T>): Promise<T> {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        const result = await callback(client)
        await client.query('COMMIT')
        return result
    } catch (error) {
        await client.query('ROLLBACK')
        throw error
    } finally {
        client.release()
    }
}
