# SyncRevenue Website

Marketing and lead-capture website for SyncRevenue — a commission engine for the travel industry built by Sync Sirius. Includes a public landing page, an admin dashboard, and a contact/demo request system.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| Backend | Node.js, Express |
| Database | SQLite (better-sqlite3) |
| Auth | JWT (HTTP-only cookies) |
| Email | Nodemailer (SMTP) |
| Testing | Vitest, Playwright, Lighthouse CI |
| Production | Phusion Passenger on Hostinger VPS |

## Getting Started

### Requirements

- Node.js >= 22
- Python 3 + `paramiko` (for deployment only: `pip install paramiko`)

### Install

```bash
npm install
```

### Environment

Copy the example env file and fill in the values:

```bash
cp .env.example .env
```

Key variables for local development:

```env
PORT=3001
DB_PATH=../data/sync_sirius.db
JWT_SECRET=<generate with: openssl rand -hex 32>
ALLOWED_ORIGIN=http://localhost:5173
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_USER=dev
SMTP_PASS=dev
NOTIFY_EMAIL=dev@example.com
VITE_SITE_URL=http://localhost:5173
```

### Seed the database (first run)

```bash
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=yourpassword npm run db:seed
```

### Run in development

```bash
npm run dev
```

This starts both the Vite dev server (frontend, port 5173) and the Express API server (port 3001) in parallel.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start frontend + backend in watch mode |
| `npm run build` | Production build (client + server) |
| `npm run build:prod` | Build with production URL baked in |
| `npm run deploy` | Build for production and deploy to Hostinger |
| `npm run start:prod` | Start the compiled server locally |
| `npm run typecheck` | Run TypeScript type checks |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests (watch mode) |
| `npm run test:run` | Run unit tests once |
| `npm run test:coverage` | Run unit tests with coverage report |
| `npm run test:e2e` | Run Playwright end-to-end tests |
| `npm run test:build` | Assert the production build output is correct |
| `npm run db:seed` | Seed the database with an initial admin user |
| `npm run db:backup` | Backup the SQLite database |

## Project Structure

```
├── src/                  # Frontend (React)
│   ├── pages/            # Route-level page components
│   ├── components/       # Shared UI components
│   ├── admin/            # Admin dashboard pages and components
│   ├── hooks/            # Custom React hooks
│   ├── store/            # Zustand state
│   └── i18n/             # Translations (EN, ES, PT)
├── server/               # Backend (Express)
│   ├── routes/           # API route handlers
│   ├── dao/              # Database access objects
│   ├── middleware/       # Auth and rate limiting
│   ├── schemas/          # Zod validation schemas
│   └── lib/              # Mailer and utilities
├── scripts/              # Build, test, and deploy scripts
├── tests/                # Playwright e2e tests
├── data/                 # SQLite database (gitignored)
└── dist/                 # Compiled output (gitignored)
```

## Deployment

The site runs on a Hostinger VPS using Phusion Passenger and Node.js 22. Deployment is done from your local machine.

### Deploy (standard)

After making any changes, run:

```bash
npm run deploy
```

This does everything automatically:

1. Builds the project with the production URL baked into the client bundle
2. Uploads `dist/` to the server via SFTP
3. Runs `npm ci --omit=dev` on the server
4. Restarts Passenger
5. Verifies the site is responding

### Deploy without reinstalling dependencies (faster)

If you only changed source files and did **not** touch `package.json`:

```bash
npm run build:prod
python3 scripts/deploy.py --skip-npm --verify
```

### Changing the production URL

The production URL is baked into the client bundle at build time. If you need to change it, update it in three places:

**1. `package.json`** — update the URL in `build:prod` and `deploy`:

```json
"build:prod": "VITE_SITE_URL=https://your-new-domain.com npm run build",
"deploy":     "npm run build:prod && python3 scripts/deploy.py --verify",
```

**2. `scripts/deploy.py`** — update the `SITE_URL` constant at the top of the file:

```python
SITE_URL = "https://your-new-domain.com"
```

**3. Server `.env`** — SSH into the server and update two lines:

```bash
ssh -p 65002 u718339656@185.28.21.212
nano /home/u718339656/domains/white-octopus-759195.hostingersite.com/.env
```

```env
ALLOWED_ORIGIN=https://your-new-domain.com
VITE_SITE_URL=https://your-new-domain.com
```

Then restart Passenger:

```bash
touch /home/u718339656/domains/white-octopus-759195.hostingersite.com/tmp/restart.txt
```

### Server details

| Item | Value |
|---|---|
| SSH | `ssh -p 65002 u718339656@185.28.21.212` |
| App root | `/home/u718339656/domains/white-octopus-759195.hostingersite.com/` |
| Node.js | `/opt/alt/alt-nodejs22/root/usr/bin/node` |
| Database | `data/sync_sirius.db` (inside app root) |
| Logs | `stderr.log`, `debug.log` (inside app root) |
| Restart | `touch tmp/restart.txt` (inside app root) |

### Verify the deployment

```bash
# Health check — expects {"success":true,"status":"ok"}
curl https://white-octopus-759195.hostingersite.com/api/health
```

### Troubleshooting

**"Cannot GET /"** — the `dist/client/` folder was not uploaded or the server restart is pending. Re-run `npm run deploy`.

**Passenger error page** — check the server log:
```bash
ssh -p 65002 u718339656@185.28.21.212
cat /home/u718339656/domains/white-octopus-759195.hostingersite.com/stderr.log
```

**SMTP / CORS errors** — edit `.env` on the server directly, then touch `tmp/restart.txt`.
