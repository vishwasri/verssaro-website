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

# Open firewall ports if UFW is installed
if command -v ufw >/dev/null 2>&1; then
  echo ">> Ensuring UFW firewall allows HTTP (80) and HTTPS (443)..."
  ufw allow 80/tcp >/dev/null 2>&1 || true
  ufw allow 443/tcp >/dev/null 2>&1 || true
fi

# Check if an official Let's Encrypt certificate configuration exists
if [ ! -f "certbot/conf/renewal/$DOMAIN.conf" ]; then
  echo ">> No official Let's Encrypt certificate found. Initializing..."

  # 1. Create temporary bootstrap certificate if none exists so Nginx can start
  if [ ! -f "certbot/conf/live/$DOMAIN/fullchain.pem" ]; then
    echo ">> Generating bootstrap certificate..."
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

  # 2. Ensure Nginx container is up and running on port 80 & 443
  echo ">> Ensuring Nginx container is running..."
  docker compose up -d nginx

  # 3. Remove bootstrap cert files so Certbot can create clean archive & live structure
  echo ">> Removing bootstrap certificate before issuing official Let's Encrypt cert..."
  rm -rf "certbot/conf/live/$DOMAIN" "certbot/conf/archive/$DOMAIN" "certbot/conf/renewal/$DOMAIN.conf"

  # 4. Request the official Let's Encrypt certificate
  echo ">> Requesting Let's Encrypt SSL certificate for $DOMAIN and www.$DOMAIN..."
  docker compose run --rm --entrypoint /bin/sh certbot -c \
    "certbot certonly --webroot -w /var/www/certbot -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --no-eff-email --non-interactive"

  # 5. Reload Nginx with verified certificate
  echo ">> Reloading Nginx with the verified SSL certificate..."
  docker compose exec -T nginx nginx -s reload

  echo ">> Official Let's Encrypt SSL certificate successfully installed!"
else
  echo ">> Official Let's Encrypt certificate is already active (found certbot/conf/renewal/$DOMAIN.conf)."
  echo ">> Checking for renewals..."
  docker compose run --rm --entrypoint /bin/sh certbot -c \
    "certbot renew --webroot -w /var/www/certbot --quiet"
  docker compose exec -T nginx nginx -s reload || true
fi

echo ">> SSL setup complete! Visit: https://$DOMAIN"
