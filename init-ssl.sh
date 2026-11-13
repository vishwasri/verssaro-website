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

# Check if the existing cert is missing or self-signed
IS_DUMMY=0
if [ ! -f "certbot/conf/live/$DOMAIN/fullchain.pem" ]; then
  IS_DUMMY=1
elif openssl x509 -in "certbot/conf/live/$DOMAIN/fullchain.pem" -issuer -noout 2>/dev/null | grep -qv "Let's Encrypt\|ISRG"; then
  IS_DUMMY=1
fi

if [ "$IS_DUMMY" = "1" ]; then
  echo ">> Generating temporary bootstrap SSL certificate for initial Nginx boot..."
  mkdir -p "certbot/conf/live/$DOMAIN"
  if command -v openssl >/dev/null 2>&1; then
    openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
      -keyout "certbot/conf/live/$DOMAIN/privkey.pem" \
      -out "certbot/conf/live/$DOMAIN/fullchain.pem" \
      -subj "/CN=$DOMAIN"
  fi
fi

# Open firewall ports if UFW is installed
if command -v ufw >/dev/null 2>&1; then
  echo ">> Ensuring UFW firewall allows HTTP (80) and HTTPS (443)..."
  ufw allow 80/tcp >/dev/null 2>&1 || true
  ufw allow 443/tcp >/dev/null 2>&1 || true
fi

# Ensure Nginx is running and responding
echo ">> Ensuring Nginx container is running..."
docker compose up -d nginx

# If current cert is a dummy cert, remove it so Certbot creates genuine Let's Encrypt archive & live symlinks
if [ "$IS_DUMMY" = "1" ]; then
  echo ">> Removing bootstrap certificate before issuing official Let's Encrypt cert..."
  rm -rf "certbot/conf/live/$DOMAIN" "certbot/conf/archive/$DOMAIN" "certbot/conf/renewal/$DOMAIN.conf"

  echo ">> Requesting Let's Encrypt SSL certificate for $DOMAIN and www.$DOMAIN..."
  docker compose run --rm --entrypoint "\
    certbot certonly --webroot -w /var/www/certbot \
      -d $DOMAIN -d www.$DOMAIN \
      --email $EMAIL --agree-tos --no-eff-email --non-interactive" certbot

  echo ">> Reloading Nginx with the verified SSL certificate..."
  docker compose exec -T nginx nginx -s reload
else
  echo ">> Valid Let's Encrypt certificate is already active. Checking for renewals..."
  docker compose run --rm --entrypoint "\
    certbot certonly --webroot -w /var/www/certbot \
      -d $DOMAIN -d www.$DOMAIN \
      --email $EMAIL --agree-tos --no-eff-email --non-interactive --keep-until-expiring" certbot
  docker compose exec -T nginx nginx -s reload
fi

echo ">> SSL setup complete! Visit: https://$DOMAIN"
