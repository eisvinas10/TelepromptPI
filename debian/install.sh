#!/usr/bin/env bash
# ============================================================
# Teleprompter – Debian install helper
# Run as root: sudo bash debian/install.sh
# ============================================================
set -euo pipefail

APP_DIR="/var/www/teleprompter"
DB_NAME="teleprompter"
DB_USER="teleprompter"

echo "==> Installing system dependencies..."
apt-get update -qq
apt-get install -y php php-cli php-mbstring php-xml php-mysql \
    mariadb-server nodejs npm composer chromium

echo "==> Setting up application directory..."
rsync -a --exclude='.git' --exclude='node_modules' --exclude='vendor' \
    "$(dirname "$(realpath "$0")")/.." "$APP_DIR"
chown -R www-data:www-data "$APP_DIR"

echo "==> Installing PHP dependencies..."
sudo -u www-data composer install --no-dev --working-dir="$APP_DIR"

echo "==> Installing Node dependencies and building assets..."
sudo -u www-data npm --prefix "$APP_DIR" ci
sudo -u www-data npm --prefix "$APP_DIR" run production

echo "==> Configuring environment..."
if [ ! -f "$APP_DIR/.env" ]; then
    cp "$APP_DIR/.env.example" "$APP_DIR/.env"
    sudo -u www-data php "$APP_DIR/artisan" key:generate
fi

echo "==> Setting up MariaDB database..."
DB_PASS=$(tr -dc 'A-Za-z0-9!@#%^&*' </dev/urandom | head -c 20)
mysql -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';"
mysql -e "GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$DB_USER'@'localhost'; FLUSH PRIVILEGES;"

# Write DB credentials into .env
sed -i "s/^DB_USERNAME=.*/DB_USERNAME=$DB_USER/" "$APP_DIR/.env"
sed -i "s/^DB_PASSWORD=.*/DB_PASSWORD=$DB_PASS/" "$APP_DIR/.env"

echo "==> Running database migrations..."
sudo -u www-data php "$APP_DIR/artisan" migrate --force --seed

echo "==> Creating storage symlink..."
sudo -u www-data php "$APP_DIR/artisan" storage:link

echo "==> Installing systemd services..."
install -m 644 "$APP_DIR/debian/teleprompter.service"  /etc/systemd/system/teleprompter.service
install -m 644 "$APP_DIR/debian/chromium-kiosk.service" /etc/systemd/system/chromium-kiosk@.service
systemctl daemon-reload
systemctl enable --now teleprompter.service

echo ""
echo "======================================================"
echo " Install complete!"
echo " DB password saved to $APP_DIR/.env"
echo ""
echo " To enable the kiosk browser for a desktop user run:"
echo "   systemctl enable --now chromium-kiosk@<username>"
echo "======================================================"
