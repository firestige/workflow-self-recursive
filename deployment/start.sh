#!/bin/sh
set -eu

repo_root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
compose_file="$repo_root/deployment/compose.yaml"
state_dir=${WSR_LOCAL_STATE_DIR:-"$repo_root/deployment/.local"}
secret_dir="$state_dir/secrets"
bi_port=${WSR_BI_PORT:-8080}

case "$bi_port" in
  *[!0-9]* | "")
    printf 'WSR_BI_PORT must be an integer from 1 to 65535.\n' >&2
    exit 2
    ;;
esac
if test "$bi_port" -lt 1 || test "$bi_port" -gt 65535; then
  printf 'WSR_BI_PORT must be an integer from 1 to 65535.\n' >&2
  exit 2
fi

for command_name in docker openssl; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    printf 'Required command not found: %s\n' "$command_name" >&2
    exit 1
  fi
done
if ! docker compose version >/dev/null 2>&1; then
  printf 'Docker Compose v2 is required.\n' >&2
  exit 1
fi
if ! docker info >/dev/null 2>&1; then
  printf 'Docker is installed but its daemon is not available.\n' >&2
  exit 1
fi

umask 077
mkdir -p "$secret_dir"
chmod 700 "$state_dir" "$secret_dir"
for name in admin-password backup-password runtime-password; do
  path="$secret_dir/$name"
  if ! test -s "$path"; then
    openssl rand -out "$path" -hex 32
  fi
  chmod 644 "$path"
done

WSR_EVIDENCE_ADMIN_PASSWORD_FILE="$secret_dir/admin-password" \
WSR_EVIDENCE_BACKUP_PASSWORD_FILE="$secret_dir/backup-password" \
WSR_EVIDENCE_RUNTIME_PASSWORD_FILE="$secret_dir/runtime-password" \
WSR_BI_PORT="$bi_port" \
  docker compose -f "$compose_file" up --build --wait

printf '\nWorkflow Self Recursive local services are ready:\n'
printf '  BI: http://127.0.0.1:%s/evaluate\n' "$bi_port"
printf '  Stop without deleting data: docker compose -f %s stop\n' "$compose_file"
