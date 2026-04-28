#!/usr/bin/env bash
# ============================================================
# die kleine Börse — Ersteinrichtung auf Hetzner CPX22
# Ubuntu 22.04 LTS
#
# Verwendung:
#   chmod +x deploy/setup.sh
#   sudo bash deploy/setup.sh DEINE_DOMAIN.de
# ============================================================
set -euo pipefail

DOMAIN="${1:?Bitte Domain angeben: sudo bash setup.sh meinedomain.de}"
APP_DIR="/var/www/diekleineboerse"
REPO="https://github.com/jwsupport/diekleineboerse.git"
NODE_VERSION="22"

echo "========================================"
echo " die kleine Börse — Server Setup"
echo " Domain: $DOMAIN"
echo " Verzeichnis: $APP_DIR"
echo "========================================"

# ── 1. System aktualisieren ──────────────────────────────────
echo "[1/9] System aktualisieren..."
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq curl git nginx certbot python3-certbot-nginx ufw fail2ban

# ── 2. Node.js installieren ──────────────────────────────────
echo "[2/9] Node.js $NODE_VERSION installieren..."
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt-get install -y -qq nodejs

# pnpm installieren
npm install -g pnpm@latest pm2

# ── 3. Firewall konfigurieren ────────────────────────────────
echo "[3/9] Firewall einrichten..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# ── 4. Fail2Ban konfigurieren ────────────────────────────────
echo "[4/9] Fail2Ban einrichten..."
systemctl enable fail2ban --now

# ── 5. Repository klonen ─────────────────────────────────────
echo "[5/9] Repository klonen..."
mkdir -p /var/www
if [ -d "$APP_DIR" ]; then
  echo "  Verzeichnis existiert — aktualisiere..."
  git -C "$APP_DIR" pull origin main
else
  git clone "$REPO" "$APP_DIR"
fi

# ── 6. Umgebungsvariablen einrichten ─────────────────────────
echo "[6/9] Umgebungsvariablen..."
if [ ! -f "$APP_DIR/.env" ]; then
  cp "$APP_DIR/deploy/.env.production.example" "$APP_DIR/.env"
  echo ""
  echo "  WICHTIG: Fülle die Werte in $APP_DIR/.env aus!"
  echo "  nano $APP_DIR/.env"
  echo ""
  read -p "  Drücke Enter wenn fertig..."
fi

# ── 7. Dependencies installieren & bauen ─────────────────────
echo "[7/9] Dependencies & Build..."
cd "$APP_DIR"
pnpm install --frozen-lockfile

# Umgebungsvariablen laden
set -a; source "$APP_DIR/.env"; set +a

# API-Server bauen
NODE_ENV=production pnpm --filter @workspace/api-server run build

# Frontend bauen (BASE_PATH=/)
BASE_PATH=/ NODE_ENV=production pnpm --filter @workspace/marketplace run build

# ── 8. Nginx konfigurieren ───────────────────────────────────
echo "[8/9] Nginx konfigurieren..."
# Nginx-Konfiguration installieren
sed "s/DEINE_DOMAIN.de/$DOMAIN/g" "$APP_DIR/deploy/nginx.conf" > /etc/nginx/nginx.conf

# Testen ob Config valide
nginx -t

# SSL-Zertifikat holen (temporärer HTTP-only Server nötig)
systemctl start nginx
certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "admin@$DOMAIN" || true

systemctl reload nginx

# ── 9. PM2 starten & Autostart ───────────────────────────────
echo "[9/9] PM2 starten..."
mkdir -p /var/log/pm2

# .env laden und PM2 starten
cd "$APP_DIR"
pm2 start deploy/ecosystem.config.cjs --env production
pm2 save

# Systemd-Unit für PM2 einrichten (Autostart nach Reboot)
pm2 startup systemd -u root --hp /root | tail -1 | bash || true

echo ""
echo "========================================"
echo " Setup abgeschlossen!"
echo ""
echo " App läuft auf: https://$DOMAIN"
echo " PM2-Status:    pm2 status"
echo " PM2-Logs:      pm2 logs dkb-api"
echo " Nginx-Logs:    tail -f /var/log/nginx/access.log"
echo "========================================"
