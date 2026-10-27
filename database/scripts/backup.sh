#!/usr/bin/env bash
set -e
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backups/postgres"
mkdir -p "$BACKUP_DIR"

echo "Initiating Ethiopian HMS PostgreSQL Database Backup..."
pg_dump -U "$POSTGRES_USER" -h "$POSTGRES_HOST" "$POSTGRES_DB" | gzip > "$BACKUP_DIR/ehms_backup_$TIMESTAMP.sql.gz"
echo "Backup successfully created at $BACKUP_DIR/ehms_backup_$TIMESTAMP.sql.gz"
