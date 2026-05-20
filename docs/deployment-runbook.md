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

### HSTS Preload — Important Caveat

The application sets `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` in production. The `preload` directive signals eligibility for inclusion in browser HSTS preload lists (see [hstspreload.org](https://hstspreload.org)).

**Before submitting the domain to the preload list, understand:**

- Preloading is **irreversible on short notice**. Removal requests are honoured, but propagation to all browsers takes months.
- All subdomains must also be served over HTTPS with a valid certificate. If any subdomain cannot serve HTTPS, do not preload.
- If the TLS certificate lapses while the domain is on the preload list, visitors using Chrome/Firefox/Edge will be unable to reach the site via HTTP fallback — the browser will refuse the connection entirely.
- **Do not submit to the preload list until the domain is stable, certificates are auto-renewing reliably, and all required subdomains support HTTPS.**

To submit (only when ready): visit [https://hstspreload.org](https://hstspreload.org) and follow the instructions.

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

`server/index.ts` includes a middleware (active only when `NODE_ENV=production`) that checks the `X-Forwarded-Proto` header and issues a 301 redirect if the value is `http`. The same production block also enables Express's `trust proxy` setting so the rest of the stack sees correct request metadata (see [Trust Proxy & X-Forwarded-* Trust Chain](#trust-proxy--x-forwarded--trust-chain) below):

```typescript
if (process.env.NODE_ENV === 'production') {
  // Trust the first hop in the X-Forwarded-For chain (Nginx/Caddy on the same host).
  app.set('trust proxy', 1)

  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] === 'http') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`)
    }
    next()
  })
}
```

This middleware is a fallback. If the reverse proxy is properly configured to redirect HTTP to HTTPS at the network level (Level 1), this middleware will never trigger. It exists to protect against misconfigured proxy setups that might let plain HTTP through.

### Trust Proxy & X-Forwarded-* Trust Chain

In production, `server/index.ts` calls `app.set('trust proxy', 1)`. This tells Express to trust the **first hop** in the `X-Forwarded-*` header chain — i.e. the single Nginx/Caddy reverse proxy that terminates TLS on the same host. Without this setting, Express ignores the proxy-supplied headers when resolving `req.protocol`, `req.secure`, and `req.ip`, which leads to two concrete issues:

1. **Incorrect protocol/IP resolution.** `req.protocol` would always report `http`, `req.secure` would always be `false`, and `req.ip` would resolve to the proxy's loopback address (`127.0.0.1`) instead of the real client IP.
2. **Broken per-client rate limiting.** `express-rate-limit` (configured in `server/middleware/rateLimit.ts`) uses `req.ip` as the default keying function. Without `trust proxy`, every request appears to originate from `127.0.0.1`, so all clients share a single rate-limit bucket. With `trust proxy 1`, the limiter keys per real client IP — which is what AC 3 of Story 5.9 verifies and what the existing rate-limit regression tests cover.

**Operational notes:**

- The value `1` is correct for a **single-hop** reverse proxy (Nginx or Caddy on the same host). If a CDN or additional load balancer is later placed in front of Nginx, the value must increase to account for the extra hop, or be replaced with an explicit CIDR/IP list. See [Express behind proxies](https://expressjs.com/en/guide/behind-proxies.html) for the full option set.
- The Nginx config in **Level 1** above already sets `proxy_set_header X-Forwarded-Proto $scheme` and `Host $host`. The `X-Forwarded-For` header is added automatically by Nginx and consumed by Express via the `trust proxy` setting. Adding `proxy_set_header X-Real-IP $remote_addr` is **optional** — Express uses `X-Forwarded-For` by default and does not need `X-Real-IP`.
- In dev/test (`NODE_ENV !== 'production'`), `trust proxy` is **not** enabled — there is no reverse proxy in front of Express locally, and trusting forged headers would be a security regression. The test suite in `server/index.test.ts` asserts both the production and dev/test states.

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

## 9. Post-Deploy Header Verification

Lighthouse CI (LHCI), configured in `lighthouserc.json` / `lighthouserc.mobile.json`, audits the production bundle by serving `dist/client/` through `vite preview`. Vite preview is a static-file server intended for build verification — it does **not** run the Express production server in `server/index.ts`, and therefore does **not** apply the security and caching headers that real production traffic receives. The Helmet-derived headers (`Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, etc.) and the long-lived asset cache header (`Cache-Control: public, max-age=31536000, immutable`) are set by Express middleware and are absent from LHCI runs by design. A passing LHCI report is therefore **not** evidence that production headers are correctly applied.

After every first production deploy (and after any change to `server/index.ts`, `helmet` configuration, or the reverse-proxy config), manually verify the headers using `curl -I` against the live domain. All commands below assume the production domain is `https://syncsirius.com`; substitute the actual domain if different.

### HSTS — Strict-Transport-Security

```bash
curl -sSI https://syncsirius.com/api/health | grep -i strict-transport-security
```

Expected response line (case-insensitive header name, exact directive payload):

```
strict-transport-security: max-age=31536000; includeSubDomains; preload
```

If this header is missing, traffic over plain HTTP after the first visit is not protected by HSTS — the redirect at the proxy is the only safeguard. Confirm `helmet()` is invoked in `server/index.ts` and that the reverse proxy is **not** stripping response headers.

### Cache-Control on Hashed Assets

Pick any hashed asset from the deployed bundle (the filename pattern is `assets/<name>-<hash>.{js,css,woff2}`) and verify it carries the one-year immutable cache directive:

```bash
ASSET=$(curl -sS https://syncsirius.com/ | grep -oE 'assets/[^"]+\.(js|css)' | head -n1)
curl -sSI "https://syncsirius.com/${ASSET}" | grep -i cache-control
```

Expected response line:

```
cache-control: public, max-age=31536000, immutable
```

If the header reads `no-cache`, `max-age=0`, or is missing entirely, repeat visitors will refetch the entire JS/CSS bundle on every navigation, regressing TTFB and wasting CDN/bandwidth budget. Confirm the `express.static()` call in `server/index.ts` is configured with `immutable: true, maxAge: '1y'` (or equivalent) and that no upstream cache (Nginx `expires`, Caddy `header Cache-Control`) is overriding it.

### X-Content-Type-Options

```bash
curl -sSI https://syncsirius.com/api/health | grep -i x-content-type-options
```

Expected:

```
x-content-type-options: nosniff
```

If absent, the browser may MIME-sniff responses and execute non-script payloads as scripts. Confirm `helmet()` is active.

### Why LHCI Cannot Cover This

LHCI runs Lighthouse against `vite preview` so the audit reflects the **client bundle** (HTML, JS, CSS, asset hashes, font preloads, image formats) without depending on a running Express process, database, or production environment variables. This is the right tradeoff for performance and accessibility audits — it isolates the bundle from server-side variance — but it means LHCI **cannot** assert on response headers set by Express. The post-deploy `curl` checks above are the only automated-ish verification of those headers, and they must be re-run on every deploy that touches `server/index.ts`, `helmet` options, the reverse-proxy config, or the static-file caching directives.

---

## Related Documents

- `docs/monitoring-setup.md` — UptimeRobot health check configuration
- `docs/backup-cron-setup.md` — Automated SQLite backup cron setup
- `.env.example` — Full list of required environment variables with descriptions
- `ecosystem.config.js` — PM2 process configuration
