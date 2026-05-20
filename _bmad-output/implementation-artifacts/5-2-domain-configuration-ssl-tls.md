# Story 5.2 — Domain Configuration & SSL/TLS

**Epic:** 5 — Production Deployment (Phase 4)
**Status:** ready-for-dev
**Depends on:** Story 5.1 (Production Build & PM2), Story 5.3 (Environment Variable Hardening), Story 5.5 (Uptime Monitoring & Health Check)

---

## Story

As a Sync Sirius operator, I want the site served over HTTPS on the production domain with a valid SSL certificate, so that all data in transit is encrypted and browsers show no security warnings.

---

## Acceptance Criteria

### AC 1 — HTTP to HTTPS Redirect
- `http://[domain]` redirects to `https://[domain]` with a 301 permanent redirect.
- No plain HTTP traffic is accepted in production.
- Implementation: middleware in `server/index.ts` that checks `X-Forwarded-Proto: http` (reverse-proxy setups) and redirects; guarded by `NODE_ENV === 'production'` so dev/test servers are unaffected.

### AC 2 — Valid SSL Certificate + HSTS Header
- SSL certificate is not self-signed and not expired.
- Browser shows no security warnings (padlock icon, no mixed-content).
- `Strict-Transport-Security` (HSTS) header is present on all responses in production.
- HSTS configuration: `max-age=31536000; includeSubDomains; preload` (1 year, sub-domains included, eligible for browser preload list).
- In dev/test environments, HSTS is disabled to prevent browser cache poisoning.

### AC 3 — CORS Restricted to Production Domain
- `ALLOWED_ORIGIN` env var is set to the production domain (e.g., `https://syncsirius.com`).
- `Access-Control-Allow-Origin` response header matches exactly the configured origin.
- Wildcard `*` is never returned — not even for un-matched origins.
- Both GET and OPTIONS (preflight) requests are validated.

### AC 4 — Database Persistence Across Deploys
- `data/sync_sirius.db` survives deploys; file is never inside `dist/`.
- `DB_PATH` env var points to a persistent location outside the build output directory.
- Deployment runbook documents the correct `DB_PATH` configuration and includes a pre-deploy checklist item to verify this.

---

## Tasks / Subtasks

- [ ] AC 1: Add HTTP→HTTPS redirect middleware to `server/index.ts`, guarded by `NODE_ENV === 'production'`, checking `X-Forwarded-Proto: http` header
- [ ] AC 2: Explicitly configure Helmet HSTS in `server/index.ts` with `maxAge=31536000, includeSubDomains: true, preload: true` in production; disable in dev/test
- [ ] AC 2: Write test in `server/index.test.ts` verifying HSTS header presence and maxAge in production mode
- [ ] AC 1: Write test verifying HTTP→HTTPS redirect fires in production with `X-Forwarded-Proto: http` header
- [ ] AC 1: Write test verifying redirect does NOT fire in test/dev environment
- [ ] AC 3: Write test verifying `Access-Control-Allow-Origin` returns specific origin (not `*`) when `ALLOWED_ORIGIN` is set
- [ ] AC 3: Write test verifying CORS preflight (OPTIONS) returns correct origin header
- [ ] AC 4: Create `docs/deployment-runbook.md` with full production deployment guide including SSL/TLS setup, HTTP→HTTPS redirect (Nginx and Caddy), env vars checklist, database persistence section, first-deploy checklist, and zero-downtime PM2 reload procedure

---

## Implementation Notes

### HTTP→HTTPS Redirect Strategy

Two approaches depending on the server setup:

**Option A — Reverse proxy level (preferred):** Nginx or Caddy handles TLS termination and HTTP→HTTPS redirect before requests reach Express. Express sees only HTTPS traffic via `X-Forwarded-Proto: https`. The application-level middleware serves as a defence-in-depth fallback.

**Option B — Application level:** If Express receives traffic directly on port 80 and port 443 simultaneously (no reverse proxy), the redirect middleware must detect the insecure connection directly via `req.secure` or port. This is documented in the runbook but not recommended for production because TLS termination at the application layer requires managing certificate files in Node.js.

The middleware added in this story implements the X-Forwarded-Proto check (Option A defence-in-depth), which is correct for Nginx/Caddy reverse proxy setups.

### SSL Certificate Provider

Recommended: **Let's Encrypt via Certbot** (free, auto-renewing) or **Caddy auto-TLS** (zero-config). Both approaches are documented in `docs/deployment-runbook.md`.

### Database Persistence

The `dist/` directory is fully regenerated on each deploy (`npm run build` wipes and rebuilds it). Any file inside `dist/` is destroyed on deploy. `DB_PATH` must point outside this directory — e.g., `/var/lib/syncrevenue/sync_sirius.db` or a sibling `data/` directory at the same level as `dist/`.
