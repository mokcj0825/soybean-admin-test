#!/usr/bin/env sh
set -eu

# update-to-code: ensure node_modules updated and Prisma client generated.

cd "$(dirname "$0")/../.."

PKG_MANAGER=${PKG_MANAGER:-pnpm}

case "$PKG_MANAGER" in
  pnpm) pnpm install --frozen-lockfile || pnpm install ;;
  npm) npm ci || npm install ;;
  yarn) yarn install --frozen-lockfile || yarn install ;;
  *) echo "Unsupported PKG_MANAGER: $PKG_MANAGER" >&2; exit 1 ;;
esac

cd prisma
prisma generate

echo "Dependencies updated and Prisma client generated."
