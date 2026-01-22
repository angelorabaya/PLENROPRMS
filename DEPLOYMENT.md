# PLENRO-PTO Deployment Guide (Windows Server + HTTPS + PM2)

Complete guide for deploying PLENRO-PTO to Windows Server with HTTPS, custom domain, and auto-start on boot.

---

## Prerequisites (On Windows Server)

Run in PowerShell as **Administrator**:

```powershell
# Install Node.js LTS from https://nodejs.org/

# Install required global packages
npm install -g pm2 serve pm2-windows-startup

# Install Chocolatey (if not installed)
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install mkcert
choco install mkcert -y

# Install local CA (one-time)
mkcert -install

# Setup PM2 auto-start on boot
pm2-startup install
```

---

## Step 1: Copy Files to Server

Copy to `C:\Sites\PLENRO-PTO`:

```
PLENRO-PTO/
├── dist/                    # Built frontend
├── backend/
│   ├── dist/                # Built backend
│   ├── package.json
│   └── package-lock.json
├── ecosystem.config.cjs     # PM2 config
└── logs/                    # Create this folder
```

---

## Step 2: Install Backend Dependencies

```powershell
cd C:\Sites\PLENRO-PTO\backend
npm install --production
```

---

## Step 3: Create Environment File

Create `C:\Sites\PLENRO-PTO\.env` (in the ROOT folder):

```env
PORT=5000
NODE_ENV=production

# Database
DB_SERVER=YOUR_SQL_SERVER_IP
DB_USER=your_db_user
DB_PASSWORD=your_password
DB_NAME=your_database_name
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

> **Important:** The `.env` must be in ROOT folder, not backend folder.

---

## Step 4: Generate SSL Certificates

```powershell
cd C:\Sites\PLENRO-PTO
mkdir certs

# Include your domain and IP
mkcert -key-file ./certs/server-key.pem -cert-file ./certs/server.pem localhost 127.0.0.1 192.168.12.76 portal.plenroprms.local
```

---

## Step 5: Configure Windows Server DNS

1. Open **DNS Manager** (`dnsmgmt.msc`)
2. Right-click **Forward Lookup Zones** → **New Zone** → `plenroprms.local`
3. Right-click the zone → **New Host (A)**
   - Name: `portal`
   - IP: `192.168.12.76`
4. Click **Add Host**

**Verify:**
```powershell
nslookup portal.plenroprms.local 127.0.0.1
```

---

## Step 6: Configure Firewall

```powershell
New-NetFirewallRule -DisplayName "PLENRO HTTPS 443" -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "PLENRO Backend HTTPS" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
```

---

## Step 7: Start Application

```powershell
cd C:\Sites\PLENRO-PTO
pm2 start ecosystem.config.cjs
pm2 save
pm2 list
```

---

## Step 8: Install CA on Client Computers

1. On server, run `mkcert -CAROOT` to find CA location
2. Copy `rootCA.pem` to clients (NOT `rootCA-key.pem`)
3. On client: Rename to `rootCA.crt`, double-click, install to **Trusted Root Certification Authorities**
4. Restart browser

---

## Access URLs

| Service | URL |
|---------|-----|
| Frontend | `https://portal.plenroprms.local` |
| Backend API | `https://portal.plenroprms.local:5000/api` |

---

## PM2 Commands

| Command | Description |
|---------|-------------|
| `pm2 list` | Show status |
| `pm2 logs` | View logs |
| `pm2 restart all` | Restart apps |
| `pm2 save` | Save for auto-start |

---

## Troubleshooting

### DNS not resolving on multi-adapter machines
Add to hosts file (`C:\Windows\System32\drivers\etc\hosts`):
```
192.168.12.76    portal.plenroprms.local
```

### Database connection failing
Ensure `.env` is in ROOT folder, not backend folder.

### "Too many requests" error
Increase `RATE_LIMIT_MAX` in `.env`, then `pm2 restart plenro-backend`

### SSL certificate not trusted
Regenerate with correct domain:
```powershell
cd C:\Sites\PLENRO-PTO\certs
mkcert -key-file server-key.pem -cert-file server.pem localhost 127.0.0.1 YOUR_IP portal.plenroprms.local
pm2 restart all
```
