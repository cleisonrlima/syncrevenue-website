# Story 5.9 — Express Trust Proxy Configuration

**Epic:** 5 — Production Deployment (Phase 4)
**Status:** ready-for-dev
**Depends on:** Story 5.2 (Domain Configuration & SSL/TLS)
**Origin:** Story 5.2 cross-model review finding R4 (2026-05-20)

---

## Story

As a Sync Sirius operator, I want Express to be correctly configured for the reverse-proxy environment, so that `req.protocol`, `req.secure`, and `req.ip` return accurate values for all middleware that relies on them.

---

## Background

Story 5.2 added HTTP→HTTPS redirect middleware that reads `req.headers['x-forwarded-proto']` directly. This works in isolation but leaves Express in an inconsistent state: without `app.set('trust proxy', 1)`, Express ignores the `X-Forwarded-*` headers for its own protocol/IP resolution. As a result:

- `req.protocol` always returns `'http'` even when the connection is via HTTPS through Nginx/Caddy.
- `req.secure` always returns `false`.
- `req.ip` returns the proxy IP instead of the real client IP.

Any future middleware that branches on `req.secure` or uses `req.ip` for rate limiting would silently misbehave. The `express-rate-limit` package (already used in this project) uses `req.ip` for per-client rate limiting — without trust proxy, all clients behind the reverse proxy share the same IP bucket (the proxy's loopback address), making rate limiting ineffective per client.

---

## Acceptance Criteria

### AC 1 — Trust Proxy Enabled in Production

- `app.set('trust proxy', 1)` is set in `server/index.ts` when `NODE_ENV === 'production'`.
- Setting is placed before the HTTP→HTTPS redirect middleware so all subsequent middleware sees correct `req.protocol` and `req.ip`.
- In dev/test, trust proxy is NOT enabled (no reverse proxy in local environment).

### AC 2 — req.protocol Accuracy Test

- New test in `server/index.test.ts` verifies that in production mode with `X-Forwarded-Proto: https`, `req.protocol` equals `'https'`.
- New test verifies that in production mode with `X-Forwarded-Proto: http`, redirect fires AND `req.protocol` equals `'http'` (before redirect).

### AC 3 — Rate Limiting Uses Real Client IP

- Existing rate-limit tests continue to pass (no regression).
- Document in `docs/deployment-runbook.md` that `trust proxy 1` is required for per-client rate limiting to work correctly behind a single-hop reverse proxy.

### AC 4 — Runbook Updated

- `docs/deployment-runbook.md` section 4 (HTTP→HTTPS Redirect) documents that `app.set('trust proxy', 1)` is configured in production and explains the `X-Forwarded-For` trust chain.
- Section mentions that `proxy_set_header X-Real-IP $remote_addr` is optional for Nginx setups and that Express uses `X-Forwarded-For` by default.

---

## Tasks / Subtasks

- [ ] AC 1: Add `app.set('trust proxy', 1)` inside `if (process.env.NODE_ENV === 'production')` block in `server/index.ts`, before the redirect middleware
- [ ] AC 2: Write test verifying `req.protocol === 'https'` in production mode with `X-Forwarded-Proto: https`
- [ ] AC 2: Write test verifying redirect middleware still fires when `X-Forwarded-Proto: http` in production (trust proxy should not break redirect)
- [ ] AC 3: Verify all existing rate-limit tests pass; confirm `req.ip` correctness is documented
- [ ] AC 4: Update `docs/deployment-runbook.md` to document trust proxy config and its effect on rate limiting and IP resolution

---

## Implementation Notes

### Correct Placement

```typescript
if (process.env.NODE_ENV === 'production') {
  // Trust the first hop in the X-Forwarded-For chain (Nginx/Caddy reverse proxy).
  // Required for req.protocol, req.secure, and req.ip to reflect real values.
  app.set('trust proxy', 1)

  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] === 'http') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`)
    }
    next()
  })
}
```

### Trust Proxy Value

`1` means "trust the first proxy in the chain." For a single Nginx/Caddy reverse proxy terminating TLS on the same host, this is correct. If the architecture adds a CDN or load balancer in front of Nginx, this value may need to be increased or set to a specific IP/CIDR.

### Rate Limiting Impact

`express-rate-limit` uses `req.ip` as the default key. Without trust proxy, all requests appear to come from `127.0.0.1` (the loopback address of the proxy), meaning the rate limit window is shared across ALL clients — one heavy user can trigger rate limiting for everyone. With trust proxy enabled, `req.ip` returns the real client IP from `X-Forwarded-For[0]`, making per-client limiting accurate.
