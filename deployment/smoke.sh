#!/bin/sh
set -eu

repo_root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
compose_file="$repo_root/deployment/compose.yaml"
compose_project="wsrsmoke-$$"
host_port="${WSR_SMOKE_PORT:-18081}"
secret_dir=$(mktemp -d)

compose() {
  WSR_EVIDENCE_ADMIN_PASSWORD_FILE="$secret_dir/admin" \
    WSR_EVIDENCE_BACKUP_PASSWORD_FILE="$secret_dir/backup" \
    WSR_EVIDENCE_RUNTIME_PASSWORD_FILE="$secret_dir/runtime" \
    WSR_BI_PORT="$host_port" \
    docker compose -p "$compose_project" -f "$compose_file" "$@"
}

cleanup() {
  compose down --volumes >/dev/null 2>&1 || true
  find /tmp -maxdepth 1 -name "wsr-smoke-response-$$" -delete
  if test -d "$secret_dir"; then
    find "$secret_dir" -type f -delete
    rmdir "$secret_dir" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

openssl rand -out "$secret_dir/admin" -hex 32
openssl rand -out "$secret_dir/backup" -hex 32
openssl rand -out "$secret_dir/runtime" -hex 32
chmod 700 "$secret_dir"
chmod 644 "$secret_dir/admin" "$secret_dir/backup" "$secret_dir/runtime"

compose up --build --wait
base_url="http://127.0.0.1:${host_port}"

app_members=$(docker network inspect "${compose_project}_app-tier" --format '{{range .Containers}}{{.Name}} {{end}}')
db_members=$(docker network inspect "${compose_project}_evidence-db" --format '{{range .Containers}}{{.Name}} {{end}}')
case "$app_members" in *"${compose_project}-evidence-1"*) ;; *) exit 1 ;; esac
case "$app_members" in *"${compose_project}-evolution-1"*) ;; *) exit 1 ;; esac
case "$app_members" in *"${compose_project}-bi-app-1"*) ;; *) exit 1 ;; esac
case "$app_members" in *"${compose_project}-database-1"*) exit 1 ;; esac
case "$db_members" in *"${compose_project}-database-1"*) ;; *) exit 1 ;; esac
case "$db_members" in *"${compose_project}-evidence-1"*) ;; *) exit 1 ;; esac
case "$db_members" in *"${compose_project}-evolution-1"* | *"${compose_project}-bi-app-1"*) exit 1 ;; esac

curl --fail --silent "$base_url/healthz" | grep -qx ok
curl --fail --silent "$base_url/evaluate" | grep -q '<div id="root"></div>'
curl --fail --silent "$base_url/v1/evidence/tasks?limit=1" | grep -q '"items"'
curl --fail --silent \
  --header 'content-type: application/json' \
  --data '{"api_version":1,"mode":"SINGLE","selection":{"selection_version":1,"task_ids":["task-smoke"]}}' \
  "$base_url/api/evolution/v1/evaluations:compute" | grep -q '"metric_results"'

http_code=$(curl --silent --output /dev/null --write-out '%{http_code}' "$base_url/v1/evidence/manifests")
test "$http_code" = 404

compose stop evolution >/dev/null
curl --fail --silent "$base_url/healthz" | grep -qx ok
curl --fail --silent "$base_url/evaluate" | grep -q '<div id="root"></div>'
curl --fail --silent "$base_url/v1/evidence/tasks?limit=1" | grep -q '"items"'
http_code=$(curl --silent --output /dev/null --write-out '%{http_code}' \
  --header 'content-type: application/json' --data '{}' \
  "$base_url/api/evolution/v1/evaluations:compute")
test "$http_code" = 502 || test "$http_code" = 504

compose start evolution >/dev/null
attempt=0
until compose exec --no-tty evolution python -c \
  "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/healthz', timeout=2).read()" \
  >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  test "$attempt" -lt 30
  sleep 0.2
done
compose stop evidence >/dev/null
curl --fail --silent "$base_url/healthz" | grep -qx ok
curl --fail --silent "$base_url/evaluate" | grep -q '<div id="root"></div>'
http_code=$(curl --silent --output /dev/null --write-out '%{http_code}' "$base_url/v1/evidence/tasks?limit=1")
test "$http_code" = 502 || test "$http_code" = 504
http_code=$(curl --silent --output /tmp/wsr-smoke-response-$$ --write-out '%{http_code}' \
  --header 'content-type: application/json' \
  --data '{"api_version":1,"mode":"SINGLE","selection":{"selection_version":1,"task_ids":["task-smoke"]}}' \
  "$base_url/api/evolution/v1/evaluations:compute")
test "$http_code" = 503
grep -q '"code":"UPSTREAM_UNAVAILABLE"' /tmp/wsr-smoke-response-$$
