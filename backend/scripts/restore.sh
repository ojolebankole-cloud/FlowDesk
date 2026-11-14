#!/bin/sh
set -eu
: "${DATABASE_URL:?DATABASE_URL is required}"
: "${DB_BACKUP:?Set DB_BACKUP to a verified .sql.gz.age backup}"
: "${BACKUP_AGE_IDENTITY:?Set BACKUP_AGE_IDENTITY to the age identity file}"
if [ "${CONFIRM_DESTRUCTIVE_RESTORE:-}" != "YES" ]; then echo 'Refusing restore: set CONFIRM_DESTRUCTIVE_RESTORE=YES after verifying the target database.' >&2; exit 2; fi
[ -f "$DB_BACKUP" ] || { echo 'Database backup not found.' >&2; exit 1; }
command -v age >/dev/null 2>&1 || { echo 'age is required' >&2; exit 1; }
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT HUP INT TERM
age -d -i "$BACKUP_AGE_IDENTITY" -o "$TMP" "$DB_BACKUP"
gzip -t "$TMP"
echo 'Restoring database (existing data will be replaced)...'
gunzip -c "$TMP" | psql "$DATABASE_URL" --set ON_ERROR_STOP=1
echo 'Restore finished. Verify migrations, object-storage access, application health, and critical workflows before reopening traffic.'
