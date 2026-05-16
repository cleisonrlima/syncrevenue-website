# Sandbox Conventions

> See also: [[Code/Backend]] for server test patterns, [[Code/Patterns-Gallery]] for canonical patterns.

This doc codifies the workarounds the team has accumulated for running tests inside sandboxed agent harnesses that cannot bind local ports. The recipes here were discovered piecemeal across Stories 2.2, 2.5, 2.6, and 2.7; Story 3.10 collected them into one reference.

---

## Symptom

Many sandboxed runtimes (some local LLM agent harnesses, certain CI runners with locked-down networking) cannot bind `127.0.0.1:5173` (or any other dev-server port) due to `EPERM`. Playwright's default `webServer` block — which starts `npm run dev` and waits for `http://localhost:5173` — fails immediately in those environments:

```
Error: Process from config.webServer was not able to start. Exit code: 1
```

The bind failure surfaces as `listen EPERM 127.0.0.1:5173`. Production builds, GitHub Actions runners, and ordinary local developer machines do not hit this; it is sandbox-specific.

---

## Workaround Recipe

Set `PLAYWRIGHT_BASE_URL` to a port that does NOT need to bind (`127.0.0.1:9` — the discard port; nothing serves on it but the URL parses cleanly). Playwright's `webServer` block is also skipped when the env var is set, so the harness never tries to launch the dev server.

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:9 npm run test:e2e -- --project=chromium
```

Use this command for any spec that does not require a real dev server (smoke tests that assert page structure via Playwright API only — no `await page.goto(...)`-style network calls). See the Caveat section below.

---

## How it works

`playwright.config.ts` reads `PLAYWRIGHT_BASE_URL` and uses it as `baseURL`:

```ts
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`
```

(`playwright.config.ts:4`)

The same env var also short-circuits the auto-`webServer` block, so Playwright does not try to spawn `npm run dev`:

```ts
webServer: process.env.PLAYWRIGHT_BASE_URL
  ? undefined
  : {
      command: 'npm run dev',
      url: BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
```

(`playwright.config.ts:28`)

The combination means: setting `PLAYWRIGHT_BASE_URL` opts out of both behaviors that the sandbox cannot satisfy — port binding and auto-server lifecycle.

---

## Caveat: `127.0.0.1:9` serves no content

The discard port is a stand-in URL. Specs that make real HTTP calls against `baseURL` (`await page.goto('/')`, `await page.click(...)` on a real page, network-driven flows) will fail with connection-refused errors when run against `127.0.0.1:9`. Two acceptable patterns:

- **Self-contained spec** — exercise Playwright APIs that do not require a live server (URL parsing, configuration assertions, fixture-driven mocks). Rare in this repo.
- **Opt-in via env-var guard** — the established pattern from `tests/e2e/seo-assets.spec.ts:12`:

  ```ts
  test.skip(!process.env.PLAYWRIGHT_BASE_URL, 'Run this spec against npm run preview so dist/client assets are exercised.')
  ```

  Specs guarded this way run only when a real base URL is supplied (e.g., `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173`, pointing at `npm run preview`). They skip in sandbox runs.

Most existing specs in `tests/e2e/` are real-server specs. The sandbox workaround does NOT make them pass — it only unblocks the harness so the spec runner can boot, surface its skip/fail counts, and exit cleanly without an `EPERM` crash.

---

## Real-server runs

On a developer machine that can bind ports, no env var is needed:

```bash
npm run test:e2e
```

Playwright spawns `npm run dev`, waits for `http://localhost:5173`, then runs the suite.

For builds-only runs against `dist/client`:

```bash
npm run build
PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173 npx vite preview --port 4173 &
PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173 npm run test:e2e
```

---

## CI note

GitHub Actions runners (used by `.github/workflows/quality.yml`) can bind ports freely. The `e2e` job runs `npm run test:e2e` without `PLAYWRIGHT_BASE_URL` set — the auto-`webServer` block boots, the suite runs in full, and the workaround is irrelevant. Do NOT set `PLAYWRIGHT_BASE_URL` in CI YAML; doing so would force every CI run into the discard-port mode and skip every guarded spec.

---

## History

Where this recipe was used inline before being codified here:

- **Story 2.2** — Demo request form e2e; sandbox-blocked verification recorded in `_bmad-output/implementation-artifacts/2-2-demo-request-form-full-stack.md`.
- **Story 2.5** — SMTP notification e2e; sandbox-blocked verification.
- **Story 2.6** — Form accessibility e2e; sandbox-blocked verification.
- **Story 2.7** — Security hardening; first explicit `PLAYWRIGHT_BASE_URL=http://127.0.0.1:9 npm run test:e2e -- tests/e2e/security-hardening.spec.ts --project=chromium` recipe documented at `_bmad-output/implementation-artifacts/2-7-security-hardening-rate-limiting-headers-locale-allowlist.md:243`.

Epic 2 retro flagged this as action item A6 (`⏳ Partial — workaround discovered in 2.7; codify centrally`). Story 3.10 closes A6 by promoting the recipe to this doc.
