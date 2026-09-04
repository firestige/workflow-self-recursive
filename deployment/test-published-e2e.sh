#!/bin/sh
set -eu

if test "${WSR_RUN_PUBLISHED_E2E:-}" != 1; then
  printf 'SKIP: set WSR_RUN_PUBLISHED_E2E=1 to run the published-image lifecycle test.\n'
  exit 0
fi

root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
manifest=${WSR_PUBLISHED_E2E_MANIFEST:-"$root/release/compose/0.1.4.json"}
temporary=$(mktemp -d "${TMPDIR:-/tmp}/wsr-published-e2e.XXXXXX")
bundle="$temporary/bundle"
suffix=$(openssl rand -hex 6)
volume="wsr-published-e2e-$suffix"
project="wsr_published_e2e_$suffix"

free_port() {
  python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1",0)); print(s.getsockname()[1]); s.close()'
}

export COMPOSE_PROJECT_NAME="$project"
export WSR_EVIDENCE_PORT=${WSR_EVIDENCE_PORT:-$(free_port)}
export WSR_EVOLUTION_PORT=${WSR_EVOLUTION_PORT:-$(free_port)}
export WSR_EVIDENCE_VOLUME="$volume"
export WSR_LOCAL_STATE_DIR="$temporary/state"
export WSR_READY_TIMEOUT_SECONDS=${WSR_READY_TIMEOUT_SECONDS:-30}

cleanup() {
  if test -f "$bundle/compose.yaml"; then
    docker compose -f "$bundle/compose.yaml" down --remove-orphans >/dev/null 2>&1 || true
  fi
  case "$volume" in
    wsr-published-e2e-*) docker volume rm "$volume" >/dev/null 2>&1 || true ;;
    *) printf 'Refusing to remove non-E2E volume %s.\n' "$volume" >&2 ;;
  esac
  rm -rf "$temporary"
}
trap cleanup EXIT HUP INT TERM

"$root/deployment/published/build-bundle.py" "$manifest" "$bundle"
cd "$bundle"
sha256sum --check SHA256SUMS
docker compose -f compose.yaml config --quiet

"$bundle/wsr-compose" start
curl --fail --silent --show-error "http://127.0.0.1:$WSR_EVIDENCE_PORT/healthz" >/dev/null
curl --fail --silent --show-error "http://127.0.0.1:$WSR_EVOLUTION_PORT/healthz" >/dev/null

export WSR_EVIDENCE_ADMIN_PASSWORD_FILE="$WSR_LOCAL_STATE_DIR/secrets/admin-password"
export WSR_EVIDENCE_BACKUP_PASSWORD_FILE="$WSR_LOCAL_STATE_DIR/secrets/backup-password"
export WSR_EVIDENCE_RUNTIME_PASSWORD_FILE="$WSR_LOCAL_STATE_DIR/secrets/runtime-password"
export WSR_EVOLUTION_CONFIG_FILE="$bundle/evolution.config.json"
schema=$(docker compose -f compose.yaml exec -T database \
  psql -U wsr_evidence_admin -d wsr_evidence -Atc 'select version_num from alembic_version')
test "$schema" = 20260828_0004

# Remove the database-side marker and prove the volume label still prevents a
# different state directory from claiming the retained data.
docker compose -f compose.yaml exec -T database \
  psql -U wsr_evidence_admin -d wsr_evidence -v ON_ERROR_STOP=1 \
  -c 'create table if not exists wsr_upgrade_probe (value text primary key)' \
  -c "insert into wsr_upgrade_probe values ('retained') on conflict do nothing" >/dev/null
docker compose -f compose.yaml exec -T database sh -c \
  'mv "$PGDATA/.wsr-state-identity" "$PGDATA/.wsr-state-identity.legacy"'
original_identity=$(tr -d '\r\n' < "$WSR_LOCAL_STATE_DIR/service-state-identity")
original_state_dir=$WSR_LOCAL_STATE_DIR
"$bundle/wsr-compose" down
export WSR_LOCAL_STATE_DIR="$temporary/reconciled-state"
set +e
foreign_output=$("$bundle/wsr-compose" start 2>&1)
foreign_status=$?
set -e
test "$foreign_status" -eq 20
case "$foreign_output" in
  *'different WSR state directory'*) ;;
  *) printf '%s\n' "$foreign_output" >&2; exit 1 ;;
esac
export WSR_LOCAL_STATE_DIR=$original_state_dir
"$bundle/wsr-compose" start
export WSR_EVIDENCE_ADMIN_PASSWORD_FILE="$WSR_LOCAL_STATE_DIR/secrets/admin-password"
export WSR_EVIDENCE_BACKUP_PASSWORD_FILE="$WSR_LOCAL_STATE_DIR/secrets/backup-password"
export WSR_EVIDENCE_RUNTIME_PASSWORD_FILE="$WSR_LOCAL_STATE_DIR/secrets/runtime-password"
test "$(tr -d '\r\n' < "$WSR_LOCAL_STATE_DIR/service-state-identity")" = "$original_identity"
test "$(docker compose -f compose.yaml exec -T database psql -U wsr_evidence_admin -d wsr_evidence -Atc "select value from wsr_upgrade_probe where value = 'retained'")" = retained

password_before=$(sha256sum "$WSR_EVIDENCE_RUNTIME_PASSWORD_FILE" | cut -d' ' -f1)
"$bundle/wsr-compose" restart
"$bundle/wsr-compose" upgrade
"$bundle/wsr-compose" rollback
password_after=$(sha256sum "$WSR_EVIDENCE_RUNTIME_PASSWORD_FILE" | cut -d' ' -f1)
test "$password_before" = "$password_after"
test "$(docker compose -f compose.yaml exec -T database psql -U wsr_evidence_admin -d wsr_evidence -Atc 'select version_num from alembic_version')" = 20260828_0004

bad_config="$temporary/invalid-evolution.json"
printf '{}\n' > "$bad_config"
"$bundle/wsr-compose" down
set +e
partial_output=$(WSR_EVOLUTION_CONFIG_FILE="$bad_config" "$bundle/wsr-compose" start 2>&1)
partial_status=$?
set -e
test "$partial_status" -ne 0
case "$partial_output" in
  *'Published service stack did not become ready'*) ;;
  *) printf '%s\n' "$partial_output" >&2; exit 1 ;;
esac
"$bundle/wsr-compose" start

if "$bundle/wsr-compose" purge; then
  printf 'Unconfirmed purge unexpectedly succeeded.\n' >&2
  exit 1
fi
docker volume inspect "$volume" >/dev/null
"$bundle/wsr-compose" down
docker volume inspect "$volume" >/dev/null

printf 'PASS: published-image pull, migration, readiness, lifecycle, schema, partial failure, and retention.\n'
