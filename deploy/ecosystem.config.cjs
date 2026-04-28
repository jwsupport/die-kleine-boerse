/**
 * PM2 Ecosystem Config — die kleine Börse
 * CPX22: 3 vCPUs, 4 GB RAM
 *
 * Verwendung:
 *   pm2 start deploy/ecosystem.config.cjs
 *   pm2 reload deploy/ecosystem.config.cjs   # Zero-Downtime Update
 *   pm2 save && pm2 startup                  # Autostart nach Reboot
 */

const path = require("path");
const ROOT = "/var/www/diekleineboerse";

module.exports = {
  apps: [
    {
      name: "dkb-api",
      script: path.join(ROOT, "artifacts/api-server/dist/index.mjs"),
      cwd: ROOT,

      // Cluster-Modus: 2 Worker nutzen 2 vCPUs, 1 bleibt für Nginx/System
      instances: 2,
      exec_mode: "cluster",

      // Node.js Flags für bessere Performance
      node_args: "--enable-source-maps",

      // Neustart bei Speicherproblemen (4 GB RAM → limit bei 800 MB pro Worker)
      max_memory_restart: "800M",

      // Automatisch neustarten bei Absturz, Exponential Backoff
      autorestart: true,
      restart_delay: 1000,
      max_restarts: 10,

      // Environment
      env_production: {
        NODE_ENV: "production",
        PORT: "8080",
      },

      // Logging
      out_file: "/var/log/pm2/dkb-api-out.log",
      error_file: "/var/log/pm2/dkb-api-err.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",

      // Graceful Shutdown: auf laufende Requests warten
      kill_timeout: 5000,
      listen_timeout: 8000,
      wait_ready: false,
    },
  ],
};
