#!/bin/sh
set -eu

echo "[verssaro-backend] Waiting for MySQL and synchronizing Prisma schema..."
max_attempts=15
attempt=1

until ./node_modules/.bin/prisma db push --skip-generate; do
  if [ "$attempt" -ge "$max_attempts" ]; then
    echo "[verssaro-backend] Failed to sync Prisma schema after $max_attempts attempts." >&2
    exit 1
  fi
  echo "[verssaro-backend] MySQL not ready yet (attempt $attempt/$max_attempts), retrying in 2s..."
  attempt=$((attempt + 1))
  sleep 2
done

echo "[verssaro-backend] Prisma schema synced. Starting NestJS server..."
exec "$@"
