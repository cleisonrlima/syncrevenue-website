/**
 * PM2 Ecosystem Configuration — SyncRevenue Website
 *
 * Usage:
 *   pm2 start ecosystem.config.js        # Start / restart
 *   pm2 stop syncrevenue-website         # Stop
 *   pm2 delete syncrevenue-website       # Remove from PM2 list
 *   pm2 logs syncrevenue-website         # Tail logs
 *   pm2 status                           # Check process status
 *
 * First-deploy setup (run once as root or via sudo):
 *   pm2 startup          # Prints a systemd command — run the printed command
 *   pm2 start ecosystem.config.js
 *   pm2 save             // Saves the process list so PM2 resurrects syncrevenue-website on reboot
 *
 * Prerequisites:
 *   - Node.js installed globally
 *   - PM2 installed globally: npm install -g pm2
 *   - Production build present: npm run build
 *   - Environment variables set (see .env.example)
 */

'use strict'

module.exports = {
  apps: [
    {
      name: 'syncrevenue-website',
      script: 'dist/server/index.js',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '5s',
      watch: false,
      // Tune for your VPS RAM; override via PM2_MEMORY_LIMIT env var if needed
      max_memory_restart: '1G',
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      env: {
        NODE_ENV: 'production',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // --------------------------------------------------------------
      // PM2 cluster mode — OPT-IN (Story 5.7)
      // --------------------------------------------------------------
      // Default execution mode is 'fork' (single Node.js process). On a
      // multi-core VPS, uncomment the two fields below to spawn one worker
      // per CPU core (Node.js `cluster` module; all workers share the same
      // TCP port via the kernel-level round-robin scheduler).
      //
      //   exec_mode: 'cluster',
      //   instances: 'max',
      //
      // SQLite WRITE-SAFETY WARNING (DO NOT SKIP):
      // -----------------------------------------
      // This app uses `better-sqlite3` against a single SQLite file
      // (`server/db.ts` opens WAL mode via `PRAGMA journal_mode=WAL`).
      // WAL allows concurrent readers + a single concurrent writer per
      // database connection, but DOES NOT serialize writes across multiple
      // worker processes — concurrent writers from separate processes can
      // emit `SQLITE_BUSY` under sustained write load.
      //
      // Before enabling cluster mode, verify ONE of the following:
      //   1. Write volume stays low (< ~1 write/sec sustained — e.g. only
      //      admin actions + form submissions). Marketing-site default.
      //   2. A retry/backoff wrapper exists around every write path, OR
      //   3. The DB has been migrated off SQLite (e.g. PostgreSQL).
      //
      // For the JWT-cookie session model used by this app there is no
      // server-side session store, so cluster mode is otherwise stateless-safe.
      //
      // See ADR: `vault/Planning/Architecture-Key.md` → "Cluster Mode Decision".
      // --------------------------------------------------------------
    },
  ],
}
