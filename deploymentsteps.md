# Deployment Steps (MIS Windows Server 2019)

This guide deploys the PLENROPRMS app as a single subdomain:
`https://plenroprms.misamisoriental.gov.ph`

Architecture:
- IIS serves the built React SPA from `dist/`
- IIS reverse-proxies `/api` to the local Node/Express backend on `127.0.0.1:5001`

---

## 0) Prerequisites
- Windows Server 2019 with IIS installed
- URL Rewrite + ARR (Application Request Routing) installed
- Node.js LTS installed (for the backend)
- Access to the MIS DNS and SSL certificate management
- SQL Server access for the backend

---

## 1) DNS and SSL
1. Create a DNS record:
   - Host: `plenroprms`
   - Type: `A` (or `CNAME`)
   - Target: server public IP (or load balancer)
2. Install SSL certificate for `plenroprms.misamisoriental.gov.ph` in Windows cert store.
3. In IIS, create an HTTPS binding using that cert.

---

## 2) Build the application (on build machine or server)
From the repo root:
```powershell
npm install
npm run build
npm run build:backend
```
Outputs:
- Frontend: `dist/`
- Backend: `backend/dist/`

---

## 3) Prepare IIS site (SPA)
1. Create an IIS site with Physical Path = your deployed `dist/` folder.
2. App Pool:
   - .NET CLR: No Managed Code
   - Identity: least-privileged service account
3. Bindings:
   - HTTPS on `plenroprms.misamisoriental.gov.ph`
4. Ensure ARR proxy is enabled:
   - IIS Manager -> server node -> Application Request Routing Cache
   - Server Proxy Settings -> Enable Proxy

---

## 4) Add reverse proxy + SPA fallback
Ensure this file exists at `dist/web.config`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="API Reverse Proxy" stopProcessing="true">
          <match url="^api(/.*)?$" />
          <action type="Rewrite" url="http://127.0.0.1:5001/{R:0}" />
        </rule>
        <rule name="SPA Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="./index.html" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

Note:
- This repo already contains `public/web.config`. Vite copies it into `dist/` during build.

---

## 5) Configure backend environment
Create a `.env` file in the backend working directory (same folder where the service runs):
```
NODE_ENV=production
PORT=5001
DB_SERVER=<your_sql_server>
DB_USER=<db_user>
DB_PASSWORD=<db_password>
DB_NAME=<db_name>
DB_PORT=1433
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true

# Optional
CORS_ORIGIN=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=1000

# If using HTTP behind IIS, set:
HTTPS_ENABLED=false
```

Important:
- The frontend uses `/api` (same-origin). Do not hardcode full URLs.
- If your policy requires end-to-end TLS, set `HTTPS_ENABLED=true` and update the IIS proxy URL to `https://127.0.0.1:5001/...`.

---

## 6) Run backend as a Windows service
Option A: PM2 (simple)
```powershell
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
```

Option B: NSSM (reliable Windows service)
```powershell
nssm install PlenroPRMS-API "C:\Program Files\nodejs\node.exe" "D:\ANTIGRAVITY\PLENROPRMS\backend\dist\index.js"
nssm set PlenroPRMS-API AppDirectory "D:\ANTIGRAVITY\PLENROPRMS"
nssm set PlenroPRMS-API Start SERVICE_AUTO_START
nssm start PlenroPRMS-API
```

---

## 7) Deploy files to IIS site folder
Copy the built frontend to the IIS site path:
- Copy everything inside `dist/` into the IIS site root.

Keep the backend build in its own folder, e.g.:
- `D:\apps\plenroprms\backend\dist`

---

## 8) Firewall and ports
Allow inbound:
- 443 (HTTPS)

Ensure the backend is only listening on `127.0.0.1:5001` or blocked from public access.

---

## 9) Verify
1. Open `https://plenroprms.misamisoriental.gov.ph`
2. Check dev tools network:
   - Calls should go to `/api/...`
3. Test health endpoint:
   - `https://plenroprms.misamisoriental.gov.ph/api/dashboard/health`

---

## 10) Rollback plan
- Keep the previous `dist/` as a backup zip.
- If issues, restore old `dist/` and restart the backend service.

