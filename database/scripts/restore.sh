#!/usr/bin/env bash
set -e
if [ -z "$1" ]; then
  echo "Usage: ./restore.sh <path_to_backup_file.sql.gz>"
  exit 1
fi

BACKUP_FILE="$1"
echo "Restoring database from $BACKUP_FILE..."
gunzip -c "$BACKUP_FILE" | psql -U "$POSTGRES_USER" -h "$POSTGRES_HOST" "$POSTGRES_DB"
echo "Database restoration completed."
