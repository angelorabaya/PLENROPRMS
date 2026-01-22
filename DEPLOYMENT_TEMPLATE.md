# Windows Server Deployment Prompt Template

Use this prompt with your AI assistant to deploy a new React + Node.js application to your Windows Server.

---

## Copy this prompt and customize the placeholders:

```
I need to deploy a React + Node.js application to my Windows Server with the following setup:

**Server Details:**
- Windows Server IP: 192.168.12.76
- Deployment path: C:\Sites\[APP_NAME]
- Domain: portal.[APP_DOMAIN].local (e.g., portal.plenroprms.local)

**Application Details:**
- Frontend: React (Vite build)
- Backend: Node.js/Express with TypeScript
- Database: SQL Server at [DB_SERVER_IP]
- Frontend port: 443 (or specify port)
- Backend port: [PORT] (e.g., 5001)

**What I already have:**
- PM2 installed globally
- mkcert installed and CA trusted on client computers
- Windows Server DNS configured
- Task Scheduler configured for PM2 auto-start

**What I need:**
1. Create ecosystem.config.cjs for PM2
2. Create .env configuration template
3. Generate SSL certificate including the new domain
4. Add DNS A record for the new subdomain
5. Configure firewall rules if needed
6. Update PM2 to run the new app

**My project structure:**
- Frontend build output: dist/
- Backend build output: backend/dist/
- Backend entry point: backend/dist/index.js

Please provide step-by-step commands to deploy this application.
```

---

## Quick Reference Commands

### Check for port conflicts (run on server first!):
```powershell
# Check which ports are already in use
netstat -an | Select-String "LISTENING" | Select-String ":443 |:3000 |:5000 |:5001 |:5002 "

# Check what's using a specific port
Get-Process -Id (Get-NetTCPConnection -LocalPort [PORT]).OwningProcess

# List all PM2 apps and their ports
pm2 list
```

**Already used ports on this server:**
| Port | App | Purpose |
|------|-----|---------|
| 443 | PLENRO-PTO | Frontend HTTPS |
| 5000 | PLENRO-PTO | Backend API |
| [ADD_NEW] | [NEW_APP] | [PURPOSE] |

> ⚠️ **Each new app needs unique ports!** Suggested: 5001, 5002, 5003... for backends

### Generate certificate for new domain:
```powershell
cd C:\Sites\[APP_NAME]\certs
mkcert -key-file server-key.pem -cert-file server.pem localhost 127.0.0.1 192.168.12.76 portal.[APP_DOMAIN].local
```

### Add DNS record:
1. Open `dnsmgmt.msc`
2. Create zone `[APP_DOMAIN].local` if not exists (Right-click Forward Lookup Zones → New Zone)
3. Right-click the zone → New Host (A)
4. Name: `portal`, IP: `192.168.12.76`

### Firewall rule (if using new port):
```powershell
New-NetFirewallRule -DisplayName "[APP_NAME] Backend" -Direction Inbound -LocalPort [PORT] -Protocol TCP -Action Allow
```

### PM2 commands:
```powershell
cd C:\Sites\[APP_NAME]
pm2 start ecosystem.config.cjs
pm2 save
pm2 list
```

---

## ecosystem.config.cjs Template

```javascript
module.exports = {
    apps: [
        {
            name: '[app-name]-backend',
            script: './backend/dist/index.js',
            cwd: './',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '500M',
            env: {
                NODE_ENV: 'production',
                PORT: [BACKEND_PORT],
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
            name: '[app-name]-frontend',
            script: 'cmd',
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
```

---

## .env Template

```env
PORT=[BACKEND_PORT]
NODE_ENV=production

# Database
DB_SERVER=[SQL_SERVER_IP]
DB_USER=[DB_USER]
DB_PASSWORD=[DB_PASSWORD]
DB_NAME=[DB_NAME]
DB_PORT=1433
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true

# Connection Pool
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_CONNECTION_TIMEOUT=30000
DB_REQUEST_TIMEOUT=30000

# CORS & Rate Limiting
CORS_ORIGIN=*
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=10000
```

---

## Backend HTTPS Server Code Template

Add this to your backend's `src/index.ts` (Express server):

```typescript
import express from 'express';
import https from 'https';
import fs from 'fs';

const app = express();

// ... your middleware and routes here ...

const startServer = async () => {
    const port = process.env.PORT || 5000;
    
    // Check if HTTPS is enabled
    const httpsEnabled = process.env.HTTPS_ENABLED === 'true';

    if (httpsEnabled) {
        const keyPath = process.env.SSL_KEY_PATH || './certs/server-key.pem';
        const certPath = process.env.SSL_CERT_PATH || './certs/server.pem';

        if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
            console.error('❌ SSL certificates not found.');
            console.error(`   Expected key: ${keyPath}`);
            console.error(`   Expected cert: ${certPath}`);
            process.exit(1);
        }

        const httpsOptions = {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath),
        };

        https.createServer(httpsOptions, app).listen(port, '0.0.0.0', () => {
            console.log(`🚀 HTTPS Server running on port ${port}`);
        });
    } else {
        app.listen(port, '0.0.0.0', () => {
            console.log(`🚀 HTTP Server running on port ${port}`);
        });
    }
};

startServer();
```

This code:
- Reads `HTTPS_ENABLED` from environment variables
- Loads SSL certificates from paths specified in env vars
- Starts HTTPS server if enabled, otherwise HTTP
