#!/bin/sh
set -eu
: "${S3_ENDPOINT:?Set S3_ENDPOINT reachable from the backup runner}"
: "${S3_ACCESS_KEY_ID:?Set S3_ACCESS_KEY_ID}"
: "${S3_SECRET_ACCESS_KEY:?Set S3_SECRET_ACCESS_KEY}"
: "${BACKUP_AGE_RECIPIENT:?Set BACKUP_AGE_RECIPIENT}"
: "${BACKUP_DIR:=./backups}"
: "${BACKUP_REMOTE:?Set an encrypted off-site BACKUP_REMOTE}"
: "${S3_BUCKET:=flowdesk-files}"
command -v mc >/dev/null 2>&1 || { echo 'MinIO client (mc) is required' >&2; exit 1; }
command -v age >/dev/null 2>&1 || { echo 'age is required' >&2; exit 1; }
command -v rclone >/dev/null 2>&1 || { echo 'rclone is required' >&2; exit 1; }
mkdir -p "$BACKUP_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT HUP INT TERM
mc alias set flowdesk-backup "$S3_ENDPOINT" "$S3_ACCESS_KEY_ID" "$S3_SECRET_ACCESS_KEY" >/dev/null
mc mirror --overwrite "flowdesk-backup/$S3_BUCKET" "$WORK/$S3_BUCKET"
tar -czf "$WORK/objects-$STAMP.tar.gz" -C "$WORK" "$S3_BUCKET"
age -r "$BACKUP_AGE_RECIPIENT" -o "$BACKUP_DIR/objects-$STAMP.tar.gz.age" "$WORK/objects-$STAMP.tar.gz"
(cd "$BACKUP_DIR" && sha256sum "objects-$STAMP.tar.gz.age" > "objects-checksums-$STAMP.txt")
rclone copy "$BACKUP_DIR/objects-$STAMP.tar.gz.age" "$BACKUP_REMOTE" --immutable
rclone copy "$BACKUP_DIR/objects-checksums-$STAMP.txt" "$BACKUP_REMOTE" --immutable
printf 'Encrypted object-storage backup completed: %s\n' "$STAMP"
