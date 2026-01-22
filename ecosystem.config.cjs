module.exports = {
    apps: [
        {
            name: 'plenro-backend',
            script: './backend/dist/index.js',
            cwd: './',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '500M',
            env: {
                NODE_ENV: 'production',
                PORT: 5001,
                // HTTPS configuration - backend will read these
                HTTPS_ENABLED: 'true',
                SSL_KEY_PATH: './certs/server-key.pem',
                SSL_CERT_PATH: './certs/server.pem',
            },
            error_file: './logs/backend-error.log',
            out_file: './logs/backend-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,
        },
        {
            name: 'plenro-frontend',
            script: 'cmd',
            // serve with HTTPS on port 443 (default HTTPS port - no port needed in URL)
            args: '/c serve -s dist -l 443 --ssl-cert ./certs/server.pem --ssl-key ./certs/server-key.pem',
            cwd: './',
            instances: 1,
            autorestart: true,
            watch: false,
            interpreter: 'none',
            env: {
                NODE_ENV: 'production',
            },
            error_file: './logs/frontend-error.log',
            out_file: './logs/frontend-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,
        },
    ],
};
