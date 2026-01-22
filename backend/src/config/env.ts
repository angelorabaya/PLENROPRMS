import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * Parse environment variable as integer with default value
 */
const parseIntEnv = (value: string | undefined, defaultValue: number): number => {
    const parsed = parseInt(value || '', 10);
    return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Parse environment variable as boolean
 */
const parseBoolEnv = (value: string | undefined, defaultValue: boolean): boolean => {
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true';
};

/**
 * Application configuration loaded from environment variables
 */
export const config = {
    // Server settings
    port: parseIntEnv(process.env.PORT, 5001),
    nodeEnv: process.env.NODE_ENV || 'development',
    isDev: process.env.NODE_ENV !== 'production',

    // Database settings
    db: {
        server: process.env.DB_SERVER || 'localhost',
        user: process.env.DB_USER || 'sa',
        password: process.env.DB_PASSWORD || '',
        name: process.env.DB_NAME || 'ENRODB',
        port: parseIntEnv(process.env.DB_PORT, 1433),
        encrypt: parseBoolEnv(process.env.DB_ENCRYPT, false),
        trustServerCertificate: parseBoolEnv(process.env.DB_TRUST_SERVER_CERTIFICATE, true),
        pool: {
            min: parseIntEnv(process.env.DB_POOL_MIN, 2),
            max: parseIntEnv(process.env.DB_POOL_MAX, 10),
        },
        connectionTimeout: parseIntEnv(process.env.DB_CONNECTION_TIMEOUT, 30000),
        requestTimeout: parseIntEnv(process.env.DB_REQUEST_TIMEOUT, 30000),
    },

    // CORS settings - allow all origins since frontend (IIS) and backend (PM2) are on different ports
    cors: {
        origin: process.env.CORS_ORIGIN || true, // true = allow all origins
    },

    // Rate limiting
    rateLimit: {
        windowMs: parseIntEnv(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000), // 15 minutes
        max: parseIntEnv(process.env.RATE_LIMIT_MAX, 1000), // limit each IP to 1000 requests per window
    },
} as const;

/**
 * Validate required environment variables
 */
export const validateConfig = (): void => {
    const requiredVars = ['DB_PASSWORD'];
    const missing = requiredVars.filter((v) => !process.env[v]);

    if (missing.length > 0) {
        console.warn(`⚠️  Missing environment variables: ${missing.join(', ')}`);
        console.warn('   Please check your .env file');
    }
};
