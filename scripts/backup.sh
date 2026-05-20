#!/usr/bin/env bash
# SQLite backup script for SyncRevenue / Sync Sirius
#
# Usage:
#   bash scripts/backup.sh
#   DB_PATH=/path/to/sync_sirius.db bash scripts/backup.sh
#
# Environment variables:
#   DB_PATH    - path to the SQLite database file
#                (default: ../data/sync_sirius.db, relative to this script's dir)
#   BACKUP_DIR - directory where timestamped backups are written
#                (default: ../backups, relative to this script's dir)
#
# Web-root isolation:
#   The web root is dist/client/ (served by Express/static middleware).
#   The default BACKUP_DIR (../backups) resolves to a sibling of the project
#   root, outside dist/ and outside dist/client/, so backups are never
#   reachable via HTTP.
#
# AC 4 — failure isolation:
#   This script is run by cron, independently of PM2 / node dist/server/index.js.
#   An exit code 1 from this script is captured by cron (and optionally logged).
#   It has zero effect on the running web server process.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Resolve paths: env vars take precedence, otherwise use defaults relative to
# the script directory (which lives inside the project root).
DB_PATH="${DB_PATH:-${SCRIPT_DIR}/../data/sync_sirius.db}"
BACKUP_DIR="${BACKUP_DIR:-${SCRIPT_DIR}/../backups}"

TIMESTAMP="$(date +%Y-%m-%d_%H-%M-%S)"
BACKUP_FILE="${BACKUP_DIR}/sync_sirius_${TIMESTAMP}.db"

# ── Validation ──────────────────────────────────────────────────────────────

if [ ! -f "$DB_PATH" ]; then
  echo "[backup] ERROR: database file not found: $DB_PATH" >&2
  exit 1
fi

# ── Ensure backup directory exists ──────────────────────────────────────────

if ! mkdir -p "$BACKUP_DIR" 2>/dev/null; then
  echo "[backup] ERROR: cannot create backup directory: $BACKUP_DIR" >&2
  exit 1
fi

# ── Copy the database file ──────────────────────────────────────────────────

if ! cp "$DB_PATH" "$BACKUP_FILE"; then
  echo "[backup] ERROR: cp failed — could not write $BACKUP_FILE" >&2
  exit 1
fi

echo "[backup] Created: $BACKUP_FILE"

# ── Retention: remove backups older than 30 days (AC 2) ─────────────────────
# -mtime +30 matches files whose mtime is strictly more than 30 days ago,
# preserving at least the last 30 daily backups.

find "$BACKUP_DIR" -name "sync_sirius_*.db" -mtime +30 -delete

echo "[backup] Retention pass complete (removed files older than 30 days)"
