#!/usr/bin/env sh
set -eu

# deploy: deploy migrations to target container (port 25432). No reset allowed.

cd "$(dirname "$0")/.."

if ! command -v prisma >/dev/null 2>&1; then
  echo "Prisma CLI not found. Please install dev dependency 'prisma'." >&2
  exit 1
fi

# The Prisma datasource should point to the target DB. Override via env if needed.
# Example: export DATABASE_URL=postgresql://user:pass@localhost:25432/db?schema=public

export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:25432/postgres?schema=public}"

echo "Deploying migrations to: $DATABASE_URL"
prisma migrate deploy
prisma generate

echo "Prisma migrations deployed and client generated."

