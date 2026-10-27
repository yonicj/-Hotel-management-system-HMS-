#!/usr/bin/env bash
set -e
echo "Verifying database migrations..."
pnpm --filter=@ehms/api prisma migrate status
