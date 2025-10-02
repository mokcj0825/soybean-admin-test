#!/usr/bin/env sh
set -eu

# init: most thorough initialization (one-time). Allowed to run reset before initialization.
# After successful init, no further resets should be necessary.

cd "$(dirname "$0")/.."

# Ensure prisma is available
if ! command -v prisma >/dev/null 2>&1; then
  echo "Prisma CLI not found. Please install dev dependency 'prisma'." >&2
  exit 1
fi

# Respect existing migrations and migration_lock.toml. Do not create new files beyond _init unless needed.

# Force reset database and skip seed during init only
prisma migrate reset --force --skip-seed

# Prepare _init migration if not present
if [ ! -f "migrations/_init/migration.sql" ]; then
  mkdir -p migrations/_init
  prisma migrate diff --from-empty --to-schema-datamodel schema.prisma --script > migrations/_init/migration.sql
  prisma migrate resolve --applied _init
fi

# Apply migrations and generate client
prisma migrate deploy
prisma generate

echo "Prisma init completed. Further resets are prohibited in production." 

