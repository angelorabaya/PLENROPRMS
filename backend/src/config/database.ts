import sql from 'mssql';
import { config } from './env.js';

/**
 * MSSQL Connection Pool Configuration
 * Uses connection pooling for optimal performance
 */
const sqlConfig: sql.config = {
    user: config.db.user,
    password: config.db.password,
    database: config.db.name,
    server: config.db.server,
    port: config.db.port,
    pool: {
        min: config.db.pool.min,
        max: config.db.pool.max,
        idleTimeoutMillis: 30000,
    },
    options: {
        encrypt: config.db.encrypt,
        trustServerCertificate: config.db.trustServerCertificate,
    },
    connectionTimeout: config.db.connectionTimeout,
    requestTimeout: config.db.requestTimeout,
};

// Global connection pool
let pool: sql.ConnectionPool | null = null;

/**
 * Get database connection pool
 * Creates a new pool if one doesn't exist
 */
export const getPool = async (): Promise<sql.ConnectionPool> => {
    if (pool) {
        return pool;
    }

    try {
        console.log('📦 Creating database connection pool...');
        pool = await new sql.ConnectionPool(sqlConfig).connect();

        pool.on('error', (err) => {
            console.error('❌ Database pool error:', err);
            pool = null;
        });

        console.log('✅ Database connection pool created successfully');
        return pool;
    } catch (error) {
        console.error('❌ Failed to create database connection pool:', error);
        throw error;
    }
};

/**
 * Execute a SQL query with parameters
 * @param query SQL query string
 * @param params Query parameters (optional)
 */
export const executeQuery = async <T>(
    query: string,
    params?: Record<string, unknown>
): Promise<sql.IResult<T>> => {
    const pool = await getPool();
    const request = pool.request();

    // Add parameters if provided
    if (params) {
        for (const [key, value] of Object.entries(params)) {
            request.input(key, value);
        }
    }

    return request.query<T>(query);
};

/**
 * Execute a stored procedure
 * @param procedureName Name of the stored procedure
 * @param params Procedure parameters (optional)
 */
export const executeProcedure = async <T>(
    procedureName: string,
    params?: Record<string, unknown>
): Promise<sql.IProcedureResult<T>> => {
    const pool = await getPool();
    const request = pool.request();

    // Add parameters if provided
    if (params) {
        for (const [key, value] of Object.entries(params)) {
            request.input(key, value);
        }
    }

    return request.execute<T>(procedureName);
};

/**
 * Close the database connection pool
 */
export const closePool = async (): Promise<void> => {
    if (pool) {
        try {
            await pool.close();
            pool = null;
            console.log('🔌 Database connection pool closed');
        } catch (error) {
            console.error('❌ Error closing database pool:', error);
            throw error;
        }
    }
};

/**
 * Test database connection
 */
export const testConnection = async (): Promise<boolean> => {
    try {
        const pool = await getPool();
        const result = await pool.request().query('SELECT 1 as connected');
        return result.recordset[0]?.connected === 1;
    } catch (error) {
        console.error('❌ Database connection test failed:', error);
        return false;
    }
};

// Export sql types for use in other modules
export { sql };
