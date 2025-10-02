#!/usr/bin/env sh
set -eu

# migrate: generate migration files without touching the DB (production-safe). No reset allowed.

cd "$(dirname "$0")/.."

if ! command -v prisma >/dev/null 2>&1; then
  echo "Prisma CLI not found. Please install dev dependency 'prisma'." >&2
  exit 1
fi

NAME=${1:-auto}
# sanitize name
NAME=$(printf "%s" "$NAME" | tr ' ' '_' | tr -cd '[:alnum:]_-')

# Ensure migrations dir exists
mkdir -p migrations

# Create timestamped migration folder
TS=$(date -u +%Y%m%d%H%M%S)
MIG_DIR="migrations/${TS}_${NAME}"
mkdir -p "$MIG_DIR"

# Generate SQL diff from current migrations to the schema without connecting to DB
prisma migrate diff \
  --from-migrations \
  --to-schema-datamodel schema.prisma \
  --script > "$MIG_DIR/migration.sql"

# If no real SQL statements, remove folder and exit gracefully
if ! grep -Eq '(CREATE|ALTER|DROP)\s' "$MIG_DIR/migration.sql"; then
  rm -rf "$MIG_DIR"
  echo "No schema changes detected."
  exit 0
fi

echo "Migration created at $MIG_DIR. Review and commit before deploy."

