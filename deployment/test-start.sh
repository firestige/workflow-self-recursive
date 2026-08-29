#!/bin/sh
set -eu

repo_root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
temporary_root=$(mktemp -d)

cleanup() {
  find "$temporary_root" -type f -delete
  find "$temporary_root" -depth -type d -exec rmdir {} \; 2>/dev/null || true
}
trap cleanup EXIT INT TERM

mkdir -p "$temporary_root/bin"
docker_log="$temporary_root/docker.log"
cat >"$temporary_root/bin/docker" <<'SH'
#!/bin/sh
set -eu
printf '%s\n' "$*" >>"${WSR_TEST_DOCKER_LOG:?}"
SH
chmod +x "$temporary_root/bin/docker"

state_dir="$temporary_root/state"
output="$temporary_root/output.log"
(
  cd "$temporary_root"
  PATH="$temporary_root/bin:$PATH" \
    WSR_TEST_DOCKER_LOG="$docker_log" \
    WSR_LOCAL_STATE_DIR="$state_dir" \
    WSR_BI_PORT=19080 \
    "$repo_root/deployment/start.sh"
) >"$output"

for name in admin-password backup-password runtime-password; do
  test -s "$state_dir/secrets/$name"
done

admin_password=$(cat "$state_dir/secrets/admin-password")
PATH="$temporary_root/bin:$PATH" \
  WSR_TEST_DOCKER_LOG="$docker_log" \
  WSR_LOCAL_STATE_DIR="$state_dir" \
  WSR_BI_PORT=19080 \
  "$repo_root/deployment/start.sh"
test "$(cat "$state_dir/secrets/admin-password")" = "$admin_password"

grep -F "compose -f $repo_root/deployment/compose.yaml up --build --wait" "$docker_log" >/dev/null
grep -F "BI: http://127.0.0.1:19080/evaluate" "$output" >/dev/null
