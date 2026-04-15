import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { config, validateConfig, getPool, closePool, testConnection } from './config/index.js';
import { errorHandler, notFoundHandler } from './middleware/index.js';
import routes from './routes/index.js';

// Validate configuration on startup
validateConfig();

// Create Express app
const app = express();

// =============================================================================
// Security Middleware
// =============================================================================

// Helmet for security headers
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: config.cors.origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-log-user', 'x-log-cname'],
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: {
        success: false,
        message: 'Too many requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// =============================================================================
// Body Parsing Middleware
// =============================================================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// =============================================================================
// Request Logging (Development)
// =============================================================================

if (config.isDev) {
    app.use((req, _res, next) => {
        console.log(`📨 ${req.method} ${req.path}`);
        next();
    });
}

// =============================================================================
// API Routes
// =============================================================================

// Health check endpoint (no rate limiting)
app.get('/health', async (_req, res) => {
    let dbStatus = false;
    let dbTimestamp = '';
    
    try {
        dbStatus = await testConnection();
        if (dbStatus) {
            const result = await getPool().then(pool => 
                pool.request().query('SELECT CONVERT(varchar(23), GETDATE(), 126) as dt')
            );
            dbTimestamp = result.recordset[0]?.dt || '';
        }
    } catch (error) {
        dbStatus = false;
    }

    res.json({
        success: true,
        status: 'ok',
        timestamp: dbTimestamp || new Date().toISOString(), // keep fallback if DB is down
        database: dbStatus ? 'connected' : 'disconnected',
        environment: config.nodeEnv,
    });
});

// API routes
app.use('/api', routes);

// =============================================================================
// Error Handling
// =============================================================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// =============================================================================
// Server Startup
// =============================================================================

import https from 'https';
import fs from 'fs';

let server: any;

const startServer = async () => {
    try {
        // Initialize database connection pool
        console.log('🔌 Connecting to database...');
        await getPool();

        // Test connection
        const isConnected = await testConnection();
        if (!isConnected) {
            console.error('❌ Failed to connect to database');
            process.exit(1);
        }
        console.log('✅ Database connected successfully');

        // Check if HTTPS is enabled
        const httpsEnabled = process.env.HTTPS_ENABLED === 'true';
        const protocol = httpsEnabled ? 'https' : 'http';

        if (httpsEnabled) {
            // Load SSL certificates
            const keyPath = process.env.SSL_KEY_PATH || './certs/server-key.pem';
            const certPath = process.env.SSL_CERT_PATH || './certs/server.pem';

            if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
                console.error('❌ SSL certificates not found. Please run mkcert to generate certificates.');
                console.error(`   Expected key: ${keyPath}`);
                console.error(`   Expected cert: ${certPath}`);
                process.exit(1);
            }

            const httpsOptions = {
                key: fs.readFileSync(keyPath),
                cert: fs.readFileSync(certPath),
            };

            // Start HTTPS server
            server = https.createServer(httpsOptions, app).listen(config.port, '0.0.0.0', () => {
                console.log('');
                console.log('🚀 =============================================');
                console.log(`🚀 PLENRO-PTO Backend Server (HTTPS)`);
                console.log(`🚀 Environment: ${config.nodeEnv}`);
                console.log(`🚀 DB Server: ${config.db.server}:${config.db.port}`);
                console.log(`🚀 Port: ${config.port}`);
                console.log(`🚀 API URL: ${protocol}://localhost:${config.port}/api`);
                console.log(`🚀 Network: ${protocol}://0.0.0.0:${config.port}/api`);
                console.log(`🚀 Health: ${protocol}://localhost:${config.port}/health`);
                console.log('🚀 =============================================');
                console.log('');
            });
        } else {
            // Start HTTP server
            server = app.listen(config.port, '0.0.0.0', () => {
                console.log('');
                console.log('🚀 =============================================');
                console.log(`🚀 PLENRO-PTO Backend Server`);
                console.log(`🚀 Environment: ${config.nodeEnv}`);
                console.log(`🚀 DB Server: ${config.db.server}:${config.db.port}`);
                console.log(`🚀 Port: ${config.port}`);
                console.log(`🚀 API URL: ${protocol}://localhost:${config.port}/api`);
                console.log(`🚀 Network: ${protocol}://0.0.0.0:${config.port}/api`);
                console.log(`🚀 Health: ${protocol}://localhost:${config.port}/health`);
                console.log('🚀 =============================================');
                console.log('');
            });
        }
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// =============================================================================
// Graceful Shutdown
// =============================================================================

const shutdown = async () => {
    console.log('');
    console.log('🛑 Shutting down gracefully...');

    if (server) {
        server.close((err: Error | undefined) => {
            if (err) {
                console.error('❌ Error closing server:', err);
            } else {
                console.log('✅ Server stopped accepting connections');
            }
        });
    }

    try {
        await closePool();
        console.log('✅ Database connections closed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start the server
startServer();
