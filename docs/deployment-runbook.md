# SyncRevenue Website — Production Deployment Runbook

This runbook covers the full lifecycle of deploying the SyncRevenue website to a production VPS. Follow each section in order for a first deployment. For subsequent deploys, skip to [Zero-Downtime Deploy Procedure](#zero-downtime-deploy-procedure).

---

## 1. Production Prerequisites

### Node.js

- Node.js **22.x LTS** (matches `.nvmrc`).
- Install via nvm: `nvm install 22 && nvm use 22` or the OS package manager.

### PM2

```bash
npm install -g pm2
pm2 startup   # follow the printed systemd command to enable auto-restart on reboot
```

### Build Tools

```bash
npm ci --omit=dev   # production install (no devDependencies)
```

### SSL Certificate Provider (choose one)

| Option | Tooling | Recommended for |
|---|---|---|
| **Let's Encrypt + Certbot** | `certbot` + `nginx` or `certbot` + `apache` | Ubuntu/Debian with Nginx |
| **Caddy auto-TLS** | `caddy` binary | Simpler setups — Caddy handles cert issuance automatically |

Both options are documented below.

---

## 2. Environment Variables

Copy `.env.example` to `.env` on the server and fill in all values:

```bash
cp .env.example .env
chmod 600 .env   # restrict read access to owner only
```

Required variables (see `.env.example` for descriptions):

| Variable | Example value | Notes |
|---|---|---|
| `NODE_ENV` | `production` | Must be `production` in prod |
| `PORT` | `3001` | Internal Express port (behind reverse proxy) |
| `JWT_SECRET` | *(random 64+ char string)* | Generate with `openssl rand -base64 48` |
| `ADMIN_INITIAL_EMAIL` | `admin@syncsirius.com` | Seeded on first start |
| `ADMIN_INITIAL_PASSWORD` | *(strong password)* | Min 16 chars, change after first login |
| `ALLOWED_ORIGIN` | `https://syncsirius.com` | **Must match the production domain exactly** — no trailing slash, no wildcard |
| `DB_PATH` | `/var/lib/syncrevenue/sync_sirius.db` | **Must be outside `dist/`** — see [Database Persistence](#database-persistence) |
| `SMTP_HOST` | `smtp.example.com` | Email delivery |
| `SMTP_PORT` | `587` | |
| `SMTP_USER` | `notifications@syncsirius.com` | |
| `SMTP_PASS` | *(app password)* | |
| `SMTP_FROM` | `SyncRevenue <notifications@syncsirius.com>` | Sender display name |
| `NOTIFY_EMAIL` | `team@syncsirius.com` | Internal notification target |

---

## 3. SSL/TLS Setup

### Option A — Certbot (Let's Encrypt) + Nginx

#### Install Certbot

```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx
```

#### Obtain a Certificate

```bash
sudo certbot --nginx -d syncsirius.com -d www.syncsirius.com
```

Certbot will:
1. Issue a certificate via ACME HTTP-01 challenge.
2. Automatically update the Nginx configuration to use TLS.
3. Add a cron job or systemd timer to auto-renew before expiry.

#### Verify Auto-Renewal

```bash
sudo certbot renew --dry-run
```

### Option B — Caddy (Auto-TLS)

Caddy obtains and renews certificates from Let's Encrypt automatically on first start.

#### Install Caddy

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy
```

#### Caddyfile

Create `/etc/caddy/Caddyfile`:

```caddyfile
syncsirius.com {
    reverse_proxy localhost:3001
}
```

Caddy automatically handles TLS (Let's Encrypt), HTTP→HTTPS redirect, and HSTS. No additional configuration is needed.

---

## 4. HTTP→HTTPS Redirect

HTTP→HTTPS redirect should be configured at **two levels** for defence in depth:

### Level 1 — Reverse Proxy (primary)

**Nginx:**

```nginx
server {
    listen 80;
    server_name syncsirius.com www.syncsirius.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name syncsirius.com www.syncsirius.com;

    ssl_certificate     /etc/letsencrypt/live/syncsirius.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/syncsirius.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    # Forward the protocol so Express can detect it
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Host $host;

    location / {
        proxy_pass http://localhost:3001;
    }
}
```

**Caddy:** Handled automatically — no explicit configuration needed. Caddy passes `X-Forwarded-Proto: https` to upstream automatically.

### Level 2 — Application (defence in depth)

`server/index.ts` includes a middleware (active only when `NODE_ENV=production`) that checks the `X-Forwarded-Proto` header and issues a 301 redirect if the value is `http`:

```typescript
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] === 'http') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`)
    }
    next()
  })
}
```

This middleware is a fallback. If the reverse proxy is properly configured to redirect HTTP to HTTPS at the network level (Level 1), this middleware will never trigger. It exists to protect against misconfigured proxy setups that might let plain HTTP through.

---

## 5. Database Persistence

> **Critical:** `DB_PATH` must point to a location **outside** the `dist/` directory.

### Why This Matters

The `dist/` directory is fully regenerated on every deploy (`npm run build` wipes and rebuilds it). Any file inside `dist/` is destroyed on each deploy. If `DB_PATH` points into `dist/`, your database — and all leads, contacts, admin accounts, and audit records — will be wiped on every deployment.

### Recommended Configuration

```bash
# Create a persistent directory for the database
sudo mkdir -p /var/lib/syncrevenue
sudo chown $USER:$USER /var/lib/syncrevenue
```

Set in `.env`:

```env
DB_PATH=/var/lib/syncrevenue/sync_sirius.db
```

Alternative (relative path, project-sibling):

```env
DB_PATH=../data/sync_sirius.db
```

This places the database at `<project-root>/../data/sync_sirius.db`, one level above the project — surviving `dist/` rebuilds and even a full re-clone.

### Verify Before Deploying

Before every deploy, confirm `DB_PATH` is set and points outside `dist/`:

```bash
grep DB_PATH .env
# Must NOT contain "dist/"
```

---

## 6. First-Deploy Checklist

Work through this list top-to-bottom on the very first deployment:

- [ ] Node.js 22.x installed (`node --version`)
- [ ] PM2 installed globally and startup hook registered (`pm2 startup`)
- [ ] `.env` file created from `.env.example` and all values filled in
- [ ] `.env` permissions restricted (`chmod 600 .env`)
- [ ] `ALLOWED_ORIGIN` set to production domain — no trailing slash, no wildcard
- [ ] `DB_PATH` verified to be **outside** `dist/` (see [Database Persistence](#database-persistence))
- [ ] Persistent DB directory created and writable (`/var/lib/syncrevenue/` or equivalent)
- [ ] SSL certificate obtained (Certbot or Caddy)
- [ ] Nginx or Caddy configured to redirect HTTP→HTTPS and forward `X-Forwarded-Proto`
- [ ] Firewall allows ports 80 and 443; port 3001 is **not** exposed externally
- [ ] Build produced: `npm ci && npm run build`
- [ ] App started: `pm2 start ecosystem.config.js --env production`
- [ ] PM2 persisted: `pm2 save`
- [ ] Health check returns 200: `curl https://syncsirius.com/api/health`
- [ ] `Strict-Transport-Security` header present: `curl -I https://syncsirius.com/api/health`
- [ ] HTTP redirects to HTTPS: `curl -I http://syncsirius.com/api/health` (expect 301)
- [ ] Uptime monitor created in UptimeRobot (see `docs/monitoring-setup.md`)
- [ ] Backup cron installed (see `docs/backup-cron-setup.md`)

---

## 7. Zero-Downtime Deploy Procedure

Use this procedure for all subsequent deploys after the first.

```bash
# 1. Pull latest code
git pull origin master

# 2. Install dependencies (skip devDependencies)
npm ci --omit=dev

# 3. Build the client and server bundles
npm run build

# 4. Reload PM2 processes (zero-downtime — waits for new process to be ready before stopping old)
pm2 reload ecosystem.config.js --env production

# 5. Verify the app is running
pm2 status
curl https://syncsirius.com/api/health
```

### Rollback

If the new version is broken:

```bash
git revert HEAD   # or git checkout <previous-commit>
npm run build
pm2 reload ecosystem.config.js --env production
```

### PM2 Logs

```bash
pm2 logs syncrevenue --lines 100   # tail recent logs
pm2 logs syncrevenue --err         # errors only
```

---

## 8. SSL Certificate Renewal

### Certbot (Let's Encrypt)

Certbot installs a cron job automatically. Certificates are valid for 90 days and renewed when fewer than 30 days remain.

Verify the timer is active:

```bash
sudo systemctl status certbot.timer
# or check cron:
sudo crontab -l | grep certbot
```

Manual renewal test:

```bash
sudo certbot renew --dry-run
```

### Caddy

Caddy renews certificates automatically in the background — no action required. Monitor for renewal failures in Caddy logs:

```bash
sudo journalctl -u caddy -f
```

---

## Related Documents

- `docs/monitoring-setup.md` — UptimeRobot health check configuration
- `docs/backup-cron-setup.md` — Automated SQLite backup cron setup
- `.env.example` — Full list of required environment variables with descriptions
- `ecosystem.config.js` — PM2 process configuration
