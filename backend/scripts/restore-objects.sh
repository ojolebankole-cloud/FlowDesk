#!/bin/sh
set -eu
: "${OBJECT_BACKUP:?Set OBJECT_BACKUP to an encrypted object backup}"
: "${BACKUP_AGE_IDENTITY:?Set BACKUP_AGE_IDENTITY}"
: "${S3_ENDPOINT:?Set S3_ENDPOINT}"
: "${S3_ACCESS_KEY_ID:?Set S3_ACCESS_KEY_ID}"
: "${S3_SECRET_ACCESS_KEY:?Set S3_SECRET_ACCESS_KEY}"
: "${S3_BUCKET:=flowdesk-files}"
if [ "${CONFIRM_OBJECT_RESTORE:-}" != "YES" ]; then echo 'Refusing object restore: set CONFIRM_OBJECT_RESTORE=YES after verifying the destination bucket.' >&2; exit 2; fi
command -v mc >/dev/null 2>&1 || { echo 'mc is required' >&2; exit 1; }
command -v age >/dev/null 2>&1 || { echo 'age is required' >&2; exit 1; }
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT HUP INT TERM
age -d -i "$BACKUP_AGE_IDENTITY" -o "$WORK/objects.tar.gz" "$OBJECT_BACKUP"
tar -tzf "$WORK/objects.tar.gz" >/dev/null
tar -xzf "$WORK/objects.tar.gz" -C "$WORK"
mc alias set flowdesk-restore "$S3_ENDPOINT" "$S3_ACCESS_KEY_ID" "$S3_SECRET_ACCESS_KEY" >/dev/null
mc mirror --overwrite "$WORK/$S3_BUCKET" "flowdesk-restore/$S3_BUCKET"
echo 'Object restore completed. Verify object counts, checksums and application file downloads before reopening traffic.'
