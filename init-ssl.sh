#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${1:-verssaro.com}"
EMAIL="${2:-admin@$DOMAIN}"
TARGET_DIR="${3:-.}"

cd "$TARGET_DIR"

echo "=== VERSSARO SSL Automation (Let's Encrypt / Certbot) ==="
echo "Target Domain: $DOMAIN, www.$DOMAIN"
echo "Admin Email:   $EMAIL"

mkdir -p "certbot/conf/live/$DOMAIN" "certbot/www"

# 1. Create a temporary bootstrap certificate if none exists yet so Nginx can start
if [ ! -f "certbot/conf/live/$DOMAIN/fullchain.pem" ]; then
  echo ">> Generating temporary bootstrap SSL certificate for initial Nginx boot..."
  if command -v openssl >/dev/null 2>&1; then
    openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
      -keyout "certbot/conf/live/$DOMAIN/privkey.pem" \
      -out "certbot/conf/live/$DOMAIN/fullchain.pem" \
      -subj "/CN=$DOMAIN"
  else
    docker run --rm -v "$(pwd)/certbot/conf/live/$DOMAIN:/certs" alpine/openssl \
      req -x509 -nodes -newkey rsa:2048 -days 1 \
      -keyout /certs/privkey.pem \
      -out /certs/fullchain.pem \
      -subj "/CN=$DOMAIN"
  fi
fi

# 2. Open firewall ports if UFW is installed
if command -v ufw >/dev/null 2>&1; then
  echo ">> Ensuring UFW firewall allows HTTP (80) and HTTPS (443)..."
  ufw allow 80/tcp >/dev/null 2>&1 || true
  ufw allow 443/tcp >/dev/null 2>&1 || true
fi

# 3. Ensure Nginx is running and responding to ACME challenge
echo ">> Starting Nginx container..."
docker compose up -d nginx

# 4. Request the official Let's Encrypt certificate
echo ">> Requesting Let's Encrypt SSL certificate for $DOMAIN and www.$DOMAIN..."
docker compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    -d $DOMAIN -d www.$DOMAIN \
    --email $EMAIL --agree-tos --no-eff-email --non-interactive --keep-until-expiring" certbot

# 5. Reload Nginx to activate the verified certificate
echo ">> Reloading Nginx with the verified SSL certificate..."
docker compose exec -T nginx nginx -s reload

echo ">> SSL deployment complete! Visit: https://$DOMAIN"
