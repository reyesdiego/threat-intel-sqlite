#!/usr/bin/env bash
set -euo pipefail

DB_DIR="${DB_DIR:-/sqlite}"
DB_NAME="${DB_NAME:-threat_intel.db}"
DB_PATH="${DB_DIR}/${DB_NAME}"

BACKUP_PATH="${BACKUP_PATH:-/backup/threat_intel.db}"
SCHEMA_PATH="${SCHEMA_PATH:-/schema/schema.sql}"

mkdir -p "${DB_DIR}"

# If DB doesn't exist yet, prefer restoring from backup.
if [ ! -f "${DB_PATH}" ]; then
  if [ -f "${BACKUP_PATH}" ]; then
    echo "[entrypoint] Initializing DB from backup: ${BACKUP_PATH} -> ${DB_PATH}"
    cp "${BACKUP_PATH}" "${DB_PATH}"
  else
    echo "[entrypoint] No backup found. Creating empty DB at ${DB_PATH}"
    sqlite3 "${DB_PATH}" "PRAGMA journal_mode=WAL;"
  fi
else
  echo "[entrypoint] Using existing DB: ${DB_PATH}"
fi

# Optional: quick sanity check
echo "[entrypoint] Tables:"
sqlite3 "${DB_PATH}" ".tables" || true

# Keep container running for interactive use
echo "[entrypoint] Ready. Exec into the container to use sqlite3."
tail -f /dev/null
