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
      // exec_mode defaults to 'fork' (single process). Switch to exec_mode: 'cluster', instances: 'max' for multi-core CPUs.
    },
  ],
}
