#!/bin/sh
set -eu

# This gate proves current-source composition only. It deliberately rewrites
# the Product manifest to local archives and is never published-coordinate evidence.
printf '%s\n' 'Qualification mode: CURRENT_SOURCE_COMPOSITION (not published-coordinate evidence)'

root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
temporary_parent=${WSR_ACCEPT_TMPDIR:-${TMPDIR:-/tmp}}
preview=$(mktemp -d "$temporary_parent/wsr-current-accept.XXXXXX")
packages="$preview/packages"
bundle="$preview/bundle"
config="$preview/config.json"
acceptance_manifest="$preview/compatibility.json"
state="$preview/state"
workspace="$preview/current-branch-acceptance"
workflow_asset_pid=
namespace_suffix=$(node -e 'const {createHash}=require("node:crypto"); const path=require("node:path"); process.stdout.write(createHash("sha256").update(path.resolve(process.argv[1])).digest("hex").slice(0,12))' "$state")

export DSH_HOME="$preview/dsh-home"
export COMPOSE_PROJECT_NAME="wsr_services_$namespace_suffix"
export WSR_EVIDENCE_VOLUME="wsr-evidence-$namespace_suffix"

mkdir -p "$packages"

operation() {
  node "$root/product-operations/bin/wsr.mjs" "$1" \
    --manifest "$acceptance_manifest" \
    --config "$config" \
    --state-dir "$state"
}

cleanup() {
  status=$?
  cleanup_failed=0
  trap - 0 HUP INT TERM
  set +e

  wait_for_exit() {
    cleanup_pid=$1
    attempts=0
    while kill -0 "$cleanup_pid" >/dev/null 2>&1; do
      attempts=$((attempts + 1))
      if test "$attempts" -ge 50; then return 1; fi
      sleep 0.1
    done
    return 0
  }

  if test -n "$workflow_asset_pid"; then
    kill "$workflow_asset_pid" >/dev/null 2>&1
    wait "$workflow_asset_pid" >/dev/null 2>&1
    if ! wait_for_exit "$workflow_asset_pid"; then
      printf '验收清理不完整：workflow asset process %s 仍在运行。\n' "$workflow_asset_pid" >&2
      cleanup_failed=1
    fi
  fi

  if test -f "$config"; then
    operation stop >/dev/null 2>&1
  fi

  process_file="$state/run/dsh.json"
  if test -f "$process_file"; then
    pid=$(sed -n 's/.*"pid"[[:space:]]*:[[:space:]]*\([0-9][0-9]*\).*/\1/p' "$process_file" | head -n 1)
    case "$pid" in
      '' | *[!0-9]*) ;;
      *)
        kill "$pid" >/dev/null 2>&1
        if ! wait_for_exit "$pid"; then
          printf '验收清理不完整：DSH process %s 仍在运行。\n' "$pid" >&2
          cleanup_failed=1
        fi
        ;;
    esac
  fi

  if test -x "$bundle/wsr-compose"; then
    WSR_CONFIRM_PURGE=DELETE_EVIDENCE_DATA "$bundle/wsr-compose" purge >/dev/null 2>&1
  fi

  remaining_containers=$(docker ps -aq --filter "label=com.docker.compose.project=$COMPOSE_PROJECT_NAME" 2>/dev/null)
  if test -n "$remaining_containers"; then
    printf '验收清理不完整：Compose project %s 仍有容器。\n' "$COMPOSE_PROJECT_NAME" >&2
    cleanup_failed=1
  fi
  remaining_networks=$(docker network ls -q --filter "label=com.docker.compose.project=$COMPOSE_PROJECT_NAME" 2>/dev/null)
  if test -n "$remaining_networks"; then
    printf '验收清理不完整：Compose project %s 仍有网络。\n' "$COMPOSE_PROJECT_NAME" >&2
    cleanup_failed=1
  fi
  if docker volume inspect "$WSR_EVIDENCE_VOLUME" >/dev/null 2>&1; then
    printf '验收清理不完整：Evidence volume %s 仍然存在。\n' "$WSR_EVIDENCE_VOLUME" >&2
    cleanup_failed=1
  fi

  case "$preview" in
    "$temporary_parent"/wsr-current-accept.*) rm -rf "$preview" ;;
    *) printf 'Refusing to remove unexpected preview directory: %s\n' "$preview" >&2 ;;
  esac

  if test "$cleanup_failed" -ne 0 && test "$status" -eq 0; then status=1; fi
  if test "$status" -eq 0; then
    printf '\n验收环境已移除（DSH profile、容器、volume 和临时文件）。\n'
  else
    printf '\n验收启动失败；已移除隔离环境，退出码 %s。\n' "$status" >&2
  fi
  exit "$status"
}

trap cleanup 0
trap 'exit 130' HUP INT TERM

for command in node npm pnpm python3 jq dsh docker git; do
  if ! command -v "$command" >/dev/null 2>&1; then
    printf 'Required command not found: %s\n' "$command" >&2
    exit 1
  fi
done

ensure_submodule() {
  submodule=$1
  manifest=$2
  submodule_status=$(git -C "$root" submodule status -- "$submodule")

  case "$submodule_status" in
    -*)
      printf '正在初始化 submodule：%s\n' "$submodule"
      git -C "$root" submodule update --init -- "$submodule"
      ;;
    U*)
      printf 'Submodule has unresolved conflicts: %s\n' "$submodule" >&2
      exit 1
      ;;
  esac

  if ! test -f "$root/$submodule/$manifest"; then
    printf 'Submodule checkout is incomplete: %s (missing %s)\n' "$submodule" "$manifest" >&2
    printf 'Run: git -C %s submodule update --init -- %s\n' "$root" "$submodule" >&2
    exit 1
  fi
}

ensure_submodule execution-system package.json
ensure_submodule evidence-system pyproject.toml
ensure_submodule evolution-system Dockerfile
ensure_submodule system-contracts workflow-dsl-2-candidate/package.json
ensure_submodule workflow-package implementation/definition/package.json
ensure_submodule wsr-dsh package.json
ensure_submodule wsr-ui packages/bi/package.json

product_version=$(node -p 'require(process.argv[1]).version' "$root/product-operations/package.json")
product_manifest="$root/product-operations/manifests/product-$product_version.json"
if ! test -f "$product_manifest"; then
  printf 'Current Product manifest missing: %s\n' "$product_manifest" >&2
  exit 1
fi
services_version=$(jq -er '.components[] | select(.id == "services") | .version' "$product_manifest")
compose_manifest="$root/release/compose/$services_version.json"
if ! test -f "$compose_manifest"; then
  printf 'Compose manifest referenced by current Product is missing: %s\n' "$compose_manifest" >&2
  exit 1
fi

free_port() {
  python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1", 0)); print(s.getsockname()[1]); s.close()'
}

dsh_port=$(free_port)
evidence_port=$(free_port)
evolution_port=$(free_port)

printf '==> 1/4 构建隔离环境\n'
printf '临时目录：%s\n' "$preview"
printf '当前提交：%s\n' "$(git -C "$root" rev-parse --short HEAD)"
printf 'DSH 提交：%s\n' "$(git -C "$root/wsr-dsh" rev-parse --short HEAD)"
printf 'Shared UI 提交：%s\n' "$(git -C "$root/wsr-ui" rev-parse --short HEAD)"
printf 'Evolution 提交：%s\n' "$(git -C "$root/evolution-system" rev-parse --short HEAD)"

jq \
  --argjson dsh "$dsh_port" \
  --argjson evidence "$evidence_port" \
  --argjson evolution "$evolution_port" \
  '.services.ports = {dsh: $dsh, evidence: $evidence, evolution: $evolution}' \
  "$root/product-operations/fixtures/config.json" > "$config"

mkdir -p "$workspace/.wsr"
printf '%s\n' '# Current branch acceptance workspace' > "$workspace/README.md"
printf '%s\n' \
  '{' \
  '  "schemaVersion": "execution.repository-role-provider-bindings@1.0.0",' \
  '  "bindings": {' \
  '    "role.greeter": {' \
  '      "agentProvider": { "identity": "provider.copilot", "version": "1.0.78" },' \
  '      "model": { "provider": "github-copilot", "model": "gpt-5.3-codex" }' \
  '    },' \
  '    "role.reviewer": {' \
  '      "agentProvider": { "identity": "provider.codex", "version": "0.144.5" },' \
  '      "model": { "provider": "openai", "model": "gpt-5.6-sol" }' \
  '    },' \
  '    "role.grilling-facilitator": {' \
  '      "agentProvider": { "identity": "provider.copilot", "version": "1.0.78" },' \
  '      "model": { "provider": "github-copilot", "model": "gpt-5.3-codex" }' \
  '    },' \
  '    "role.evidence-scout": {' \
  '      "agentProvider": { "identity": "provider.copilot", "version": "1.0.78" },' \
  '      "model": { "provider": "github-copilot", "model": "gpt-5.3-codex" }' \
  '    },' \
  '    "role.system-designer": {' \
  '      "agentProvider": { "identity": "provider.copilot", "version": "1.0.78" },' \
  '      "model": { "provider": "github-copilot", "model": "gpt-5.3-codex" }' \
  '    },' \
  '    "role.architecture-reviewer": {' \
  '      "agentProvider": { "identity": "provider.copilot", "version": "1.0.78" },' \
  '      "model": { "provider": "github-copilot", "model": "gpt-5.3-codex" }' \
  '    },' \
  '    "role.problem-solution-reviewer": {' \
  '      "agentProvider": { "identity": "provider.copilot", "version": "1.0.78" },' \
  '      "model": { "provider": "github-copilot", "model": "gpt-5.3-codex" }' \
  '    },' \
  '    "role.quality-reviewer": {' \
  '      "agentProvider": { "identity": "provider.copilot", "version": "1.0.78" },' \
  '      "model": { "provider": "github-copilot", "model": "gpt-5.3-codex" }' \
  '    },' \
  '    "role.finding-aggregator": {' \
  '      "agentProvider": { "identity": "provider.copilot", "version": "1.0.78" },' \
  '      "model": { "provider": "github-copilot", "model": "gpt-5.3-codex" }' \
  '    },' \
  '    "role.fresh-reader": {' \
  '      "agentProvider": { "identity": "provider.copilot", "version": "1.0.78" },' \
  '      "model": { "provider": "github-copilot", "model": "gpt-5.3-codex" }' \
  '    }' \
  '  }' \
  '}' > "$workspace/.wsr/role-provider-bindings.json"

printf '\n==> 2/4 构建并部署本地产物\n'
(
  cd "$root/execution-system"
  pnpm release:artifacts "$packages"
)
provider_version=$(node -p 'require(process.argv[1]).version' "$root/wsr-ui/packages/bi/package.json")
provider_archive="$packages/wsr-ui-core-$provider_version.tgz"
execution_version=$(node -p 'require(process.argv[1]).version' "$root/execution-system/package.json")
execution_plugin_version=$(node -p 'require(process.argv[1]).version' "$root/wsr-dsh/packages/execution/package.json")
studio_plugin_version=$(node -p 'require(process.argv[1]).version' "$root/wsr-dsh/packages/studio/package.json")
suite_plugin_version=$(node -p 'require(process.argv[1]).version' "$root/wsr-dsh/packages/suite/package.json")
(
  cd "$root/wsr-ui"
  npm ci --ignore-scripts --no-audit --no-fund
  npm run build
  npm pack --silent --pack-destination "$packages" --workspace wsr-ui-core
)
if ! test -f "$provider_archive"; then
  printf 'Local shared UI archive missing: %s\n' "$provider_archive" >&2
  exit 1
fi
(
  cd "$root/wsr-dsh"
  npm ci --ignore-scripts --no-audit --no-fund
  node "$root/deployment/bind-local-package-candidate.mjs" --install \
    "$root/wsr-dsh/node_modules" \
    wsr-ui-core \
    "$provider_version" \
    "$provider_archive" \
    "$root/wsr-ui/node_modules"
  npm run build
  npm pack --silent --pack-destination "$packages" --workspace dsh-wsr-execution
  npm pack --silent --pack-destination "$packages" --workspace dsh-wsr-studio
  npm pack --silent --pack-destination "$packages" --workspace dsh-wsr
)

python3 "$root/deployment/published/build-bundle.py" \
  "$compose_manifest" \
  "$bundle"
node "$root/deployment/bind-local-evidence-build.mjs" \
  "$bundle/compose.yaml" \
  "$root/evidence-system" \
  "$root"

node "$root/deployment/local-manifest-consistency.mjs" \
  "$product_manifest" \
  "$root/wsr-dsh/package.json" \
  "$packages/wsr-execution-$execution_version.tgz" \
  "$packages/dsh-wsr-execution-$execution_plugin_version.tgz" \
  "$packages/dsh-wsr-studio-$studio_plugin_version.tgz" \
  "$packages/dsh-wsr-$suite_plugin_version.tgz" \
  "$bundle/release.json" \
  "$root/workflow-package/implementation/definition/package.json"

node "$root/deployment/prepare-local-dsh-acceptance.mjs" \
  "$product_manifest" \
  "$acceptance_manifest" \
  "$packages/wsr-execution-$execution_version.tgz" \
  "$packages/dsh-wsr-execution-$execution_plugin_version.tgz" \
  "$packages/dsh-wsr-studio-$studio_plugin_version.tgz" \
  "$packages/dsh-wsr-$suite_plugin_version.tgz" \
  "$provider_archive"

node "$root/product-operations/bin/wsr.mjs" setup \
  --manifest "$acceptance_manifest" \
  --config-input "$config" \
  --config "$config" \
  --state-dir "$state"

operation install

node "$root/deployment/bind-local-package-candidate.mjs" --verify \
  "$DSH_HOME/profiles/web" \
  wsr-ui-core \
  "$provider_version" \
  "$provider_archive"

node "$root/deployment/verify-local-core-install.mjs" \
  "$DSH_HOME/profiles/web" \
  "$packages/wsr-execution-$execution_version.tgz"

installed_bundle="$state/managed/wsr-services-$services_version"
mkdir -p "$installed_bundle"
cp -R "$bundle/." "$installed_bundle/"

operation preflight
printf '\n正在验证本机 Agent Provider 凭据（不会读取或输出令牌）\n'
node "$root/wsr-dsh/scripts/qualify-local-provider-auth.mjs" "$workspace"
if test -n "${WSR_ACCEPT_WORKFLOW_ASSETS:-}"; then
  workflow_asset_ready="$preview/workflow-asset-server.json"
  (
    cd "$root/execution-system"
    node --import tsx scripts/serve-workflow-assets.ts "$WSR_ACCEPT_WORKFLOW_ASSETS" "$workflow_asset_ready"
  ) >"$preview/workflow-asset-server.log" 2>&1 &
  workflow_asset_pid=$!
  attempts=0
  while ! test -f "$workflow_asset_ready"; do
    attempts=$((attempts + 1))
    if test "$attempts" -ge 100 || ! kill -0 "$workflow_asset_pid" 2>/dev/null; then
      printf 'Local Workflow asset server failed to start.\n' >&2
      exit 1
    fi
    sleep 0.1
  done
  releases_base_url=$(jq -r '.releasesBaseUrl' "$workflow_asset_ready")
  NODE_EXTRA_CA_CERTS=$(jq -r '.certificate' "$workflow_asset_ready")
  export NODE_EXTRA_CA_CERTS
  execution_config="$state/managed/dsh/execution-config.json"
  jq --arg releasesBaseUrl "$releases_base_url" \
    '.workflowSource.releasesBaseUrl = $releasesBaseUrl' \
    "$execution_config" > "$execution_config.new"
  mv "$execution_config.new" "$execution_config"
fi
operation start
operation health

url="http://127.0.0.1:$dsh_port"
node "$root/deployment/register-acceptance-workspace.mjs" "$url" "$workspace"
if test "${WSR_ACCEPT_NO_OPEN:-0}" = 1; then
  :
elif command -v open >/dev/null 2>&1; then
  open "$url"
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$url"
else
  printf '请在浏览器打开：%s\n' "$url"
fi

if test "${WSR_ACCEPT_BROWSER_QUALIFICATION:-0}" = 1; then
  printf '\n==> 3/4 自动产品验收\n'
  (
    cd "$root/execution-system"
    node --import tsx "$root/execution-system/scripts/qualify-current-source-browser.ts" \
      "$url" "$workspace" "http://127.0.0.1:$evidence_port" "${WSR_ACCEPT_BROWSER_SCENARIO:-evidence-studio}"
  )
  printf '自动产品验收通过。\n'
else
  printf '\n==> 3/4 人工验收\n'
  printf '浏览器地址：%s\n' "$url"
  printf '请选择脚本已注册的 workspace：current-branch-acceptance\n'
  printf '%s\n' \
    '1. 选择 current-branch-acceptance 并创建 Session。' \
    '2. 只发送 selector，确认出现可展开的 TASK_PROMPT_REQUIRED 完整诊断。' \
    '3. 发送 selector + Task，确认中间 Action 只出现一次且带 Action 名称，最终回答以独立回答气泡展示；不得出现空 Completed 或 WSR_PRESENTATION_INVALID。' \
    '4. 确认 WSR Studio 紧跟 Delivery，且不会跳离当前 Session。' \
    '5. 检查 Studio 的 Task、metric、receipt、fact 与 trace。'
  printf '\n验收完成后按 Enter；脚本将自动执行第 4 步清理：'
  IFS= read -r _answer
fi

printf '\n==> 4/4 移除临时资产\n'
