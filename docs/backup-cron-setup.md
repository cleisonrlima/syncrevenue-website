# SQLite Backup — Cron Setup Guide

This document explains how to configure automatic daily backups of the
`sync_sirius.db` SQLite database on the production VPS.

---

## How the Backup Script Works

`scripts/backup.sh` copies the live database to a timestamped file:

```
backups/sync_sirius_YYYY-MM-DD_HH-MM-SS.db
```

Retention is enforced automatically: files older than 30 days are removed after
each successful run, so at least 30 daily backups are always on disk.

The backup directory (`../backups` by default, relative to the project root) sits
**outside** `dist/client/` — the web root served by Express — so backup files are
never reachable via HTTP.

---

## Configuring the Cron Job

Open the crontab for the user running the app:

```bash
crontab -e
```

Add one line to run the backup every day at 2:00 AM and append all output to a
log file:

```cron
0 2 * * * cd /path/to/syncrevenue-website && DB_PATH=/path/to/data/sync_sirius.db bash scripts/backup.sh >> /var/log/syncrevenue-backup.log 2>&1
```

Replace `/path/to/syncrevenue-website` with the actual project root on the VPS
and `/path/to/data/sync_sirius.db` with the absolute path to the database file.

**Example** (if the project lives at `/var/www/syncrevenue`):

```cron
0 2 * * * cd /var/www/syncrevenue && DB_PATH=/var/www/syncrevenue/data/sync_sirius.db bash scripts/backup.sh >> /var/log/syncrevenue-backup.log 2>&1
```

### Environment Variables

| Variable     | Default (relative to script dir) | Description                           |
|--------------|----------------------------------|---------------------------------------|
| `DB_PATH`    | `../data/sync_sirius.db`         | Absolute path to the SQLite DB file   |
| `BACKUP_DIR` | `../backups`                     | Directory where backups are written   |

---

## Verifying the Setup

Run the script manually before relying on cron:

```bash
npm run db:backup
# or directly:
DB_PATH=/path/to/data/sync_sirius.db bash scripts/backup.sh
```

On success you should see:

```
[backup] Created: /path/to/backups/sync_sirius_2026-05-20_02-00-01.db
[backup] Retention pass complete (removed files older than 30 days)
```

List the backups directory to confirm the file was created:

```bash
ls -lh ../backups/
```

---

## Failure Behavior and PM2 Isolation

The backup script runs as a **cron job**, completely separate from the PM2-managed
Node.js server (`node dist/server/index.js`). A backup failure:

- Writes an `[backup] ERROR: …` line to stderr (captured by cron in the log file
  if you used `2>&1` in the cron line).
- Exits with code 1.
- **Has zero effect** on the running PM2 web server process. The site remains
  fully available regardless of backup outcome.

To receive email alerts on backup failures, configure `MAILTO` at the top of your
crontab:

```cron
MAILTO=ops@syncsirius.com
```

---

## Checking Backup Logs

```bash
tail -f /var/log/syncrevenue-backup.log
```

---

## Running the Automated Tests

```bash
npm run test:backup
```

This runs `scripts/backup.test.mjs` which verifies the happy path, retention
cleanup, and error handling using only Node.js built-in modules.
