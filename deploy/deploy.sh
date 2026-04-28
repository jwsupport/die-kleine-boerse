#!/usr/bin/env bash
# ============================================================
# die kleine Börse — Update/Redeploy Script
# Führe dieses Script nach jedem git push aus.
#
# Verwendung (auf dem Hetzner-Server):
#   cd /var/www/diekleineboerse
#   bash deploy/deploy.sh
# ============================================================
set -euo pipefail

APP_DIR="/var/www/diekleineboerse"
cd "$APP_DIR"

echo "========================================"
echo " die kleine Börse — Deployment Update"
echo " $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"

# ── 1. Neuesten Code holen ───────────────────────────────────
echo "[1/4] Code aktualisieren..."
git pull origin main

# ── 2. Dependencies aktualisieren ───────────────────────────
echo "[2/4] Dependencies installieren..."
pnpm install --frozen-lockfile

# ── 3. Build ─────────────────────────────────────────────────
echo "[3/4] Bauen..."
set -a; source "$APP_DIR/.env"; set +a

# API-Server
NODE_ENV=production pnpm --filter @workspace/api-server run build
echo "  ✓ API-Server gebaut"

# Frontend
BASE_PATH=/ NODE_ENV=production pnpm --filter @workspace/marketplace run build
echo "  ✓ Frontend gebaut"

# ── 4. Zero-Downtime Neustart ────────────────────────────────
echo "[4/4] Zero-Downtime Neustart..."
pm2 reload deploy/ecosystem.config.cjs --env production

echo ""
echo " Deployment erfolgreich abgeschlossen!"
echo " pm2 status  →  aktueller Status"
echo "========================================"
