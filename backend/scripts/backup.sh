#!/bin/sh
set -eu
: "${DATABASE_URL:?DATABASE_URL is required}"
: "${BACKUP_DIR:=./backups}"
: "${RETENTION_DAYS:=30}"
: "${BACKUP_AGE_RECIPIENT:?Set BACKUP_AGE_RECIPIENT; production backups must be encrypted}"
command -v pg_dump >/dev/null 2>&1 || { echo 'pg_dump is required' >&2; exit 1; }
command -v age >/dev/null 2>&1 || { echo 'age is required for encrypted backups' >&2; exit 1; }
mkdir -p "$BACKUP_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
TMP="$BACKUP_DIR/.flowdesk-$STAMP.sql.gz.tmp"
trap 'rm -f "$TMP"' EXIT HUP INT TERM
pg_dump --no-owner --no-acl "$DATABASE_URL" | gzip -9 > "$TMP"
age -r "$BACKUP_AGE_RECIPIENT" -o "$BACKUP_DIR/flowdesk-$STAMP.sql.gz.age" "$TMP"
rm -f "$TMP"
(cd "$BACKUP_DIR" && sha256sum "flowdesk-$STAMP.sql.gz.age" > "checksums-$STAMP.txt")
# Optional off-site replication. Configure an encrypted rclone remote (S3, B2, etc.).
if [ -n "${BACKUP_REMOTE:-}" ]; then
  command -v rclone >/dev/null 2>&1 || { echo 'rclone is required when BACKUP_REMOTE is set' >&2; exit 1; }
  rclone copy "$BACKUP_DIR/flowdesk-$STAMP.sql.gz.age" "$BACKUP_REMOTE" --immutable
  rclone copy "$BACKUP_DIR/checksums-$STAMP.txt" "$BACKUP_REMOTE" --immutable
fi
find "$BACKUP_DIR" -type f -mtime "+$RETENTION_DAYS" -delete
trap - EXIT HUP INT TERM
printf 'Encrypted database backup completed: %s\n' "$STAMP"
