# Story 5.2 — Domain Configuration & SSL/TLS

**Epic:** 5 — Production Deployment (Phase 4)
**Status:** done
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

- [x] AC 1: Add HTTP→HTTPS redirect middleware to `server/index.ts`, guarded by `NODE_ENV === 'production'`, checking `X-Forwarded-Proto: http` header
- [x] AC 2: Explicitly configure Helmet HSTS in `server/index.ts` with `maxAge=31536000, includeSubDomains: true, preload: true` in production; disable in dev/test
- [x] AC 2: Write test in `server/index.test.ts` verifying HSTS header presence and maxAge in production mode
- [x] AC 1: Write test verifying HTTP→HTTPS redirect fires in production with `X-Forwarded-Proto: http` header
- [x] AC 1: Write test verifying redirect does NOT fire in test/dev environment
- [x] AC 3: Write test verifying `Access-Control-Allow-Origin` returns specific origin (not `*`) when `ALLOWED_ORIGIN` is set
- [x] AC 3: Write test verifying CORS preflight (OPTIONS) returns correct origin header
- [x] AC 4: Create `docs/deployment-runbook.md` with full production deployment guide including SSL/TLS setup, HTTP→HTTPS redirect (Nginx and Caddy), env vars checklist, database persistence section, first-deploy checklist, and zero-downtime PM2 reload procedure

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

---

## Dev Agent Record

**Agent:** Claude Sonnet 4.6
**Commit:** 67b3fea — feat(story-5.2): domain config, HSTS, CORS verification, deployment runbook
**Date:** 2026-05-20

### File List

- `server/index.ts` — HTTP→HTTPS redirect middleware (prod-only, X-Forwarded-Proto check); explicit Helmet HSTS config (maxAge=31536000/includeSubDomains/preload in prod; disabled in dev/test)
- `server/index.test.ts` — 10 new tests: redirect behavior (3), HSTS header (2), CORS exact-match (2), CORS preflight (2), production CORS (1)
- `docs/deployment-runbook.md` — NEW: full production deployment guide (SSL/TLS, HTTP→HTTPS redirect Nginx + Caddy, env vars checklist, DB persistence, first-deploy checklist, zero-downtime PM2 reload)

### Change Log

| Date | Change |
|---|---|
| 2026-05-20 | Initial implementation — all 8 tasks complete, 757 tests pass |

---

## Review Findings

**Reviewer:** Claude Sonnet 4.6 (cross-model review, 2026-05-20)
**Outcome:** Approved with inline patches

### Findings Applied (trivial patches)

| ID | Severity | Finding | Resolution |
|---|---|---|---|
| R1 | CRITICAL | Story tasks all `[ ]` and Status `ready-for-dev` despite implementation being complete and committed — dev agent never updated story file | Patched: all tasks → `[x]`, Status → `done`, Dev Agent Record added |
| R2 | LOW | `CORS preflight with production origin` test (line 365–389) restores `ALLOWED_ORIGIN` and resets modules outside a `try/finally` — env var leaks if `request()` throws | Patched: wrapped restore/reset in `finally` block |
| R3 | MEDIUM (docs) | `preload: true` set in HSTS config with no runbook documentation of hstspreload.org submission requirements, irreversibility risk, or subdomain coverage requirement | Patched: added "HSTS Preload — Important Caveat" section to `docs/deployment-runbook.md` |

### Findings Deferred to New Story

| ID | Severity | Finding | New Story |
|---|---|---|---|
| R4 | MEDIUM | `app.set('trust proxy', 1)` not set in `server/index.ts`. Without trust proxy, `req.protocol` and `req.secure` return incorrect values (always `http`/`false`). While the middleware reads `req.headers['x-forwarded-proto']` directly (bypassing trust proxy), other Express middleware relying on `req.protocol` would be wrong. Runbook also lacks this configuration step. | Story 5.9 |

### AC Verification

| AC | Status | Evidence |
|---|---|---|
| AC 1 — HTTP→HTTPS redirect | Implemented | `server/index.ts:47-54`; tests at `server/index.test.ts:282-305` |
| AC 2 — HSTS header | Implemented | `server/index.ts:61-65`; tests at `server/index.test.ts:307-325` |
| AC 3 — CORS exact origin | Implemented | `server/index.ts:67-73`; tests at `server/index.test.ts:328-390` |
| AC 4 — DB persistence runbook | Implemented | `docs/deployment-runbook.md` section 5 + checklist item |
