# Uptime Monitoring & Health Check Setup

This document covers how to configure uptime monitoring for the SyncRevenue website in production.

## Health Check Endpoint

All monitoring services should target the dedicated health check endpoint:

```
GET https://<your-domain>/api/health
```

**Expected healthy response:**
- HTTP status: `200`
- Response body: `{ "success": true, "status": "ok", "timestamp": "<ISO 8601 string>" }`

**Degraded / unhealthy response (DB unavailable):**
- HTTP status: `503`
- Response body: `{ "success": false, "status": "db_unavailable", "timestamp": "<ISO 8601 string>" }`

The endpoint is publicly accessible — no authentication required. It performs a synchronous `SELECT 1` probe against the SQLite database to confirm DB responsiveness before returning `200 ok`.

---

## Primary Recommendation: UptimeRobot (Free Tier)

UptimeRobot's free tier supports up to 50 monitors at 5-minute intervals, which is sufficient for this project.

### Setup Steps

1. **Create an account** at [https://uptimerobot.com](https://uptimerobot.com).

2. **Create a new monitor:**
   - Monitor Type: **HTTP(s)**
   - Friendly Name: `SyncRevenue Health Check`
   - URL: `https://<your-domain>/api/health`
   - Monitoring Interval: **5 minutes**

3. **Configure keyword monitoring:**
   - Under "Advanced Settings", enable **Keyword Monitoring**.
   - Alert if keyword is absent: `"status":"ok"`
   - This catches degraded responses that return HTTP 200 but signal a problem in the body (e.g., a future partial-health status).

4. **Configure alert contacts:**
   - Add an email alert contact for the value of `NOTIFY_EMAIL` from your production environment.
   - UptimeRobot sends an alert when the endpoint is unreachable and a recovery alert when it comes back up — no manual reset required.

5. **Expected alert timing:**
   - Downtime is detected at the next polling interval (≤5 minutes after the outage begins).
   - Alert email is sent within the same poll cycle.

---

## Alternative Services

### Betteruptime

- URL: [https://betteruptime.com](https://betteruptime.com)
- Free tier: unlimited monitors, 3-minute minimum interval.
- Setup: Create a new HTTP monitor pointing to `https://<your-domain>/api/health`. Add keyword check for `"status":"ok"`. Configure email alert for `NOTIFY_EMAIL`.

### Freshping

- URL: [https://www.freshworks.com/website-monitoring](https://www.freshworks.com/website-monitoring)
- Free tier: up to 50 checks at 1-minute intervals.
- Setup: New check → URL type → `https://<your-domain>/api/health` → set keyword assertion on `"status":"ok"` → alert via email to `NOTIFY_EMAIL`.

---

## PM2 Crash & Restart Behavior

PM2 (`ecosystem.config.js`) is configured to auto-restart the process on crash. Typical restart time after a crash is 1–5 seconds. This means:

- A single process crash followed by a fast PM2 restart will almost always recover **before** the next 5-minute monitoring poll.
- In this case, no alert fires — the crash is self-healing and transparent to the monitor.
- Only **sustained outages longer than the check interval** (5 minutes) will trigger an alert.

Once the server recovers and `GET /api/health` returns HTTP 200, the monitoring service automatically transitions back to the "up" state. No manual intervention is required to reset the monitor.

---

## Load Testing / p95 Verification

Before go-live, verify that `POST /api/demo` meets the p95 ≤ 3 second SLA under realistic concurrent load.

Use `autocannon` (no install required — run via `npx`):

```bash
npx autocannon \
  -c 10 \
  -d 30 \
  -m POST \
  -H 'Content-Type: application/json' \
  -b '{"name":"Load Test","email":"test@example.com","company":"Test Corp","role":"owner","gds":"Amadeus","locale":"en"}' \
  http://localhost:3001/api/demo
```

**Parameter reference:**
- `-c 10` — 10 concurrent connections (simulates realistic concurrent demo submissions)
- `-d 30` — 30-second test duration
- `-m POST` — HTTP method
- `-H` — Content-Type header
- `-b` — request body (adjust field values as needed; use a valid `gds` value from the allowed list)

**Expected output:** Look for the `p99` (or `p95` if shown) latency in the results table. Target is ≤ 3 000 ms for p95. On a healthy VPS with SQLite and in-process SMTP queuing, typical p99 is well under 500 ms.

> Note: `autocannon` is used via `npx` only. It is not added to `package.json` dependencies and does not affect the production bundle.
