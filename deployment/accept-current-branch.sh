#!/bin/sh
set -eu

# This gate proves current-source composition only. It deliberately rewrites
# the Product manifest to local archives and is never published-coordinate evidence.
printf '%s\n' 'Qualification mode: CURRENT_SOURCE_COMPOSITION (not published-coordinate evidence)'

root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
product_manifest=${WSR_ACCEPT_PRODUCT_MANIFEST:-}
dev_artifact_set=${WSR_ACCEPT_DEV_ARTIFACT_SET:-}
diagnostic_selector=
while test "$#" -gt 0; do
  case "$1" in
    --product-manifest)
      if test "$#" -lt 2; then printf '%s\n' 'Missing value for --product-manifest' >&2; exit 2; fi
      product_manifest=$2
      shift 2
      ;;
    --diagnostic-selector)
      if test "$#" -lt 2; then printf '%s\n' 'Missing value for --diagnostic-selector' >&2; exit 2; fi
      diagnostic_selector=$2
      shift 2
      ;;
    --dev-artifact-set)
      if test "$#" -lt 2; then printf '%s\n' 'Missing value for --dev-artifact-set' >&2; exit 2; fi
      dev_artifact_set=$2
      shift 2
      ;;
    --help)
      printf '%s\n' 'usage: accept-current-branch.sh --product-manifest FILE [--dev-artifact-set FILE] [--diagnostic-selector NAME@VERSION]'
      exit 0
      ;;
    *) printf 'Unknown argument: %s\n' "$1" >&2; exit 2 ;;
  esac
done
if test -z "$product_manifest"; then
  printf '%s\n' 'A target Product manifest is required: --product-manifest FILE or WSR_ACCEPT_PRODUCT_MANIFEST=FILE' >&2
  exit 2
fi
for command in node jq; do
  if ! command -v "$command" >/dev/null 2>&1; then
    printf 'Required command not found: %s\n' "$command" >&2
    exit 1
  fi
done

# Resolve and validate the complete target before creating a workspace, initializing
# submodules, building archives, or touching Compose/DSH state.
if test -n "$diagnostic_selector"; then
  target_json=$(node "$root/deployment/resolve-current-branch-target.mjs" "$product_manifest" "$root/release/compose" "$diagnostic_selector")
else
  target_json=$(node "$root/deployment/resolve-current-branch-target.mjs" "$product_manifest" "$root/release/compose")
fi
product_manifest=$(printf '%s' "$target_json" | jq -er '.productManifest')
product_release=$(printf '%s' "$target_json" | jq -er '.productRelease')
dsh_release=$(printf '%s' "$target_json" | jq -er '.dsh.version')
execution_name=$(printf '%s' "$target_json" | jq -er '.execution.name')
execution_target_version=$(printf '%s' "$target_json" | jq -er '.execution.version')
services_version=$(printf '%s' "$target_json" | jq -er '.services.version')
compose_manifest=$(printf '%s' "$target_json" | jq -er '.services.composeManifest')
workflow_name=$(printf '%s' "$target_json" | jq -er '.workflow.name')
workflow_version=$(printf '%s' "$target_json" | jq -er '.workflow.version')
provider_target_version=$(printf '%s' "$target_json" | jq -er '.providers.version')
workload_mode=$(printf '%s' "$target_json" | jq -er '.workload.mode')
workflow_selector=$(printf '%s' "$target_json" | jq -er '.workload.selector')

dev_set_identity=
if test -n "$dev_artifact_set"; then
  dev_set_json=$(node "$root/deployment/dev-artifact-set.mjs" "$dev_artifact_set")
  dev_set_identity=$(printf '%s' "$dev_set_json" | jq -er '.identity')
  dev_product_manifest=$(printf '%s' "$dev_set_json" | jq -er '.productManifest')
  dev_workflow_selector=$(printf '%s' "$dev_set_json" | jq -er '.workflowAssets.selector')
  if test "$dev_product_manifest" != "$product_manifest"; then
    printf 'DEV_ARTIFACT_SET_INVALID: productManifest does not equal the explicit Product manifest\n' >&2
    exit 2
  fi
  if test "$workload_mode" = product-composition && test "$dev_workflow_selector" != "$workflow_selector"; then
    printf 'DEV_ARTIFACT_SET_INVALID: workflow selector does not equal the Product selector\n' >&2
    exit 2
  fi
  frozen_execution_archive=$(printf '%s' "$dev_set_json" | jq -er '.archives.executionOwner.path')
  frozen_dsh_execution_archive=$(printf '%s' "$dev_set_json" | jq -er '.archives.dshExecution.path')
  frozen_dsh_studio_archive=$(printf '%s' "$dev_set_json" | jq -er '.archives.dshStudio.path')
  frozen_dsh_suite_archive=$(printf '%s' "$dev_set_json" | jq -er '.archives.dshSuite.path')
  frozen_ui_archive=$(printf '%s' "$dev_set_json" | jq -er '.archives.uiCore.path')
  WSR_ACCEPT_WORKFLOW_ASSETS=$(printf '%s' "$dev_set_json" | jq -er '.workflowAssets.directory')
  export WSR_ACCEPT_WORKFLOW_ASSETS
fi

temporary_parent=${WSR_ACCEPT_TMPDIR:-${TMPDIR:-/tmp}}
run_id=${WSR_ACCEPT_RUN_ID:-$(node -e 'process.stdout.write(require("node:crypto").randomUUID().replaceAll("-", ""))')}
case "$run_id" in
  [a-z0-9][a-z0-9_-][a-z0-9_-][a-z0-9_-][a-z0-9_-][a-z0-9_-][a-z0-9_-][a-z0-9_-]*) ;;
  *) printf 'Invalid WSR_ACCEPT_RUN_ID: %s\n' "$run_id" >&2; exit 2 ;;
esac
failure_dir="$temporary_parent/wsr-acceptance-failure-$run_id"
if test -e "$failure_dir"; then
  printf 'Refusing to overwrite existing failure evidence: %s\n' "$failure_dir" >&2
  exit 2
fi
preview=$(mktemp -d "$temporary_parent/wsr-current-accept-$run_id.XXXXXX")
packages="$preview/packages"
bundle="$preview/bundle"
config="$preview/config.json"
acceptance_manifest="$preview/compatibility.json"
state="$preview/state"
workspace="$preview/current-branch-acceptance-$run_id"
workflow_asset_pid=
stage=isolated-workspace
lifecycle_log="$preview/lifecycle.log"
coordinates_file="$preview/coordinates.json"
operation_log="$preview/product-operations.log"
printf '%s\n' "$target_json" > "$coordinates_file"
printf 'run=%s stage=%s\n' "$run_id" "$stage" > "$lifecycle_log"
: > "$operation_log"

export DSH_HOME="$preview/dsh-home"
export COMPOSE_PROJECT_NAME="wsr_services_$run_id"
export WSR_EVIDENCE_VOLUME="wsr-evidence-$run_id"
export WSR_ACCEPT_WORKFLOW_SELECTOR="$workflow_selector"

mkdir -p "$packages"

operation() {
  operation_result="$preview/operation-$1.log"
  if node "$root/product-operations/bin/wsr.mjs" "$1" \
    --manifest "$acceptance_manifest" \
    --config "$config" \
    --state-dir "$state" >"$operation_result" 2>&1; then
    operation_status=0
  else
    operation_status=$?
  fi
  cat "$operation_result"
  cat "$operation_result" >> "$operation_log"
  rm -f "$operation_result"
  return "$operation_status"
}

cleanup() {
  status=$?
  cleanup_failed=0
  trap - 0 HUP INT TERM
  set +e

  preserve_failure_evidence() {
    test -d "$failure_dir" && return 0
    mkdir -p "$failure_dir" || return 1
    cp "$coordinates_file" "$failure_dir/coordinates.json" 2>/dev/null || :
    cp "$lifecycle_log" "$failure_dir/lifecycle.log" 2>/dev/null || :
    cp "$operation_log" "$failure_dir/product-operations.log" 2>/dev/null || :
    if test -f "$preview/workflow-asset-server.log"; then
      cp "$preview/workflow-asset-server.log" "$failure_dir/workflow-asset-server.log" 2>/dev/null || :
    fi
    if test -f "$preview/browser-qualification.json"; then
      cp "$preview/browser-qualification.json" "$failure_dir/browser-qualification.json" 2>/dev/null || :
    fi
    printf '{"runIdentity":"%s","stage":"%s","exitCode":%s}\n' "$run_id" "$stage" "$status" > "$failure_dir/result.json" || return 1
    printf '失败证据已封存：%s\n' "$failure_dir" >&2
  }

  # Preserve diagnosis before any stop/purge/removal side effect.
  if test "$status" -ne 0; then
    if ! preserve_failure_evidence; then
      printf '无法封存失败证据；保留运行目录：%s\n' "$preview" >&2
      cleanup_failed=1
    fi
  fi

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

  cleanup_max_attempts=${WSR_ACCEPT_CLEANUP_MAX_ATTEMPTS:-50}
  cleanup_poll_seconds=${WSR_ACCEPT_CLEANUP_POLL_SECONDS:-0.1}
  case "$cleanup_max_attempts" in
    '' | *[!0-9]* | 0)
      printf 'Invalid WSR_ACCEPT_CLEANUP_MAX_ATTEMPTS: %s\n' "$cleanup_max_attempts" >&2
      cleanup_max_attempts=50
      cleanup_failed=1
      ;;
  esac

  inspect_cleanup_resources() {
    remaining_containers=$(docker ps -aq --filter "label=com.docker.compose.project=$COMPOSE_PROJECT_NAME" 2>/dev/null)
    remaining_networks=$(docker network ls -q --filter "label=com.docker.compose.project=$COMPOSE_PROJECT_NAME" 2>/dev/null)
    evidence_volume_exists=0
    if docker volume inspect "$WSR_EVIDENCE_VOLUME" >/dev/null 2>&1; then
      evidence_volume_exists=1
    fi
    test -z "$remaining_containers" && test -z "$remaining_networks" && test "$evidence_volume_exists" -eq 0
  }

  wait_for_cleanup_convergence() {
    cleanup_attempt=1
    while ! inspect_cleanup_resources; do
      if test "$cleanup_attempt" -ge "$cleanup_max_attempts"; then return 1; fi
      cleanup_attempt=$((cleanup_attempt + 1))
      sleep "$cleanup_poll_seconds"
    done
    return 0
  }

  remove_remaining_resources() {
    if test -n "$remaining_containers"; then
      docker rm -f $remaining_containers >/dev/null 2>&1
    fi
    if test -n "$remaining_networks"; then
      docker network rm $remaining_networks >/dev/null 2>&1
    fi
    if test "$evidence_volume_exists" -ne 0; then
      docker volume rm -f "$WSR_EVIDENCE_VOLUME" >/dev/null 2>&1
    fi
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

  if ! wait_for_cleanup_convergence; then
    remove_remaining_resources
    if ! wait_for_cleanup_convergence; then
      if test -n "$remaining_containers"; then
        printf '验收清理不完整：Compose project %s 仍有容器。\n' "$COMPOSE_PROJECT_NAME" >&2
      fi
      if test -n "$remaining_networks"; then
        printf '验收清理不完整：Compose project %s 仍有网络。\n' "$COMPOSE_PROJECT_NAME" >&2
      fi
      if test "$evidence_volume_exists" -ne 0; then
        printf '验收清理不完整：Evidence volume %s 仍然存在。\n' "$WSR_EVIDENCE_VOLUME" >&2
      fi
      cleanup_failed=1
    fi
  fi

  if test "$cleanup_failed" -eq 0; then
    case "$preview" in
      "$temporary_parent"/wsr-current-accept-"$run_id".*) rm -rf "$preview" ;;
      *)
        printf 'Refusing to remove unexpected preview directory: %s\n' "$preview" >&2
        cleanup_failed=1
        ;;
    esac
  fi

  if test "$cleanup_failed" -ne 0 && test "$status" -eq 0; then status=1; fi
  if test "$cleanup_failed" -ne 0; then
    printf '\n验收清理未完成；临时目录已保留：%s\n' "$preview" >&2
  elif test "$status" -eq 0; then
    printf '\n验收环境已移除（DSH profile、容器、volume 和临时文件）。\n'
  else
    printf '\n验收启动失败；已移除隔离环境，退出码 %s。\n' "$status" >&2
  fi
  exit "$status"
}

trap cleanup 0
trap 'exit 130' HUP INT TERM

for command in npm pnpm python3 dsh docker git cp; do
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

free_port() {
  python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1", 0)); print(s.getsockname()[1]); s.close()'
}

dsh_port=$(free_port)
evidence_port=$(free_port)
evolution_port=$(free_port)

printf '==> 1/4 构建隔离环境\n'
printf '临时目录：%s\n' "$preview"
printf 'runIdentity: %s\n' "$run_id"
printf 'workloadMode: %s\n' "$workload_mode"
if test "$workload_mode" = diagnostic; then printf 'workloadMode: diagnostic (NON_COMPOSITION_EVIDENCE)\n'; fi
printf 'product.manifest: %s\n' "$product_manifest"
printf 'product.release: %s\n' "$product_release"
printf 'dsh-bundle: %s\n' "$dsh_release"
printf 'execution-owner: %s@%s\n' "$execution_name" "$execution_target_version"
printf 'services/compose: %s\n' "$services_version"
printf 'workflow-source: %s@%s\n' "$workflow_name" "$workflow_version"
printf 'providers: %s\n' "$provider_target_version"
printf 'workflow-selector: %s\n' "$workflow_selector"
if test -n "$dev_set_identity"; then printf 'devArtifactSet: %s\n' "$dev_set_identity"; fi
printf 'resolvedTarget: %s\n' "$target_json"
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
  '    },' \
  '    "role.goal-facilitator": {' \
  '      "agentProvider": { "identity": "provider.copilot", "version": "1.0.78" },' \
  '      "model": { "provider": "github-copilot", "model": "gpt-5.3-codex" }' \
  '    },' \
  '    "role.implementation-feasibility-validator": {' \
  '      "agentProvider": { "identity": "provider.copilot", "version": "1.0.78" },' \
  '      "model": { "provider": "github-copilot", "model": "gpt-5.3-codex" }' \
  '    },' \
  '    "role.test-designer": {' \
  '      "agentProvider": { "identity": "provider.copilot", "version": "1.0.78" },' \
  '      "model": { "provider": "github-copilot", "model": "gpt-5.3-codex" }' \
  '    },' \
  '    "role.implementer": {' \
  '      "agentProvider": { "identity": "provider.copilot", "version": "1.0.78" },' \
  '      "model": { "provider": "github-copilot", "model": "gpt-5.3-codex" }' \
  '    },' \
  '    "role.goal-adversary": {' \
  '      "agentProvider": { "identity": "provider.copilot", "version": "1.0.78" },' \
  '      "model": { "provider": "github-copilot", "model": "gpt-5.3-codex" }' \
  '    },' \
  '    "role.implementation-reviewer": {' \
  '      "agentProvider": { "identity": "provider.copilot", "version": "1.0.78" },' \
  '      "model": { "provider": "github-copilot", "model": "gpt-5.3-codex" }' \
  '    },' \
  '    "role.delivery-custodian": {' \
  '      "agentProvider": { "identity": "provider.copilot", "version": "1.0.78" },' \
  '      "model": { "provider": "github-copilot", "model": "gpt-5.3-codex" }' \
  '    }' \
  '  }' \
  '}' > "$workspace/.wsr/role-provider-bindings.json"

stage=local-artifact-build
printf 'run=%s stage=%s\n' "$run_id" "$stage" >> "$lifecycle_log"
printf '\n==> 2/4 构建并部署本地产物\n'
provider_version=$(node -p 'require(process.argv[1]).version' "$root/wsr-ui/packages/bi/package.json")
provider_archive="$packages/wsr-ui-core-$provider_version.tgz"
execution_version=$(node -p 'require(process.argv[1]).version' "$root/execution-system/package.json")
execution_plugin_version=$(node -p 'require(process.argv[1]).version' "$root/wsr-dsh/packages/execution/package.json")
studio_plugin_version=$(node -p 'require(process.argv[1]).version' "$root/wsr-dsh/packages/studio/package.json")
suite_plugin_version=$(node -p 'require(process.argv[1]).version' "$root/wsr-dsh/packages/suite/package.json")
if test -n "$dev_set_identity"; then
  cp "$frozen_execution_archive" "$packages/wsr-execution-$execution_version.tgz"
  cp "$frozen_dsh_execution_archive" "$packages/dsh-wsr-execution-$execution_plugin_version.tgz"
  cp "$frozen_dsh_studio_archive" "$packages/dsh-wsr-studio-$studio_plugin_version.tgz"
  cp "$frozen_dsh_suite_archive" "$packages/dsh-wsr-$suite_plugin_version.tgz"
  cp "$frozen_ui_archive" "$provider_archive"
else
  (
    cd "$root/execution-system"
    pnpm release:artifacts "$packages"
  )
  (
    cd "$root/wsr-ui"
    npm ci --ignore-scripts --no-audit --no-fund
    npm run build
    npm pack --silent --pack-destination "$packages" --workspace wsr-ui-core
  )
fi
if ! test -f "$provider_archive"; then
  printf 'Local shared UI archive missing: %s\n' "$provider_archive" >&2
  exit 1
fi
if test -z "$dev_set_identity"; then
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
fi

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

stage=product-setup
printf 'run=%s stage=%s\n' "$run_id" "$stage" >> "$lifecycle_log"
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
stage=product-start
printf 'run=%s stage=%s\n' "$run_id" "$stage" >> "$lifecycle_log"
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
  stage=browser-qualification
  printf 'run=%s stage=%s selector=%s mode=%s\n' "$run_id" "$stage" "$workflow_selector" "$workload_mode" >> "$lifecycle_log"
  printf '\n==> 3/4 自动产品验收\n'
  browser_result="$preview/browser-qualification.json"
  if (
    cd "$root/execution-system"
    node --import tsx "$root/execution-system/scripts/qualify-current-source-browser.ts" \
      "$url" "$workspace" "http://127.0.0.1:$evidence_port" "${WSR_ACCEPT_BROWSER_SCENARIO:-evidence-studio}" \
      "$workflow_selector"
  ) >"$browser_result"; then
    cat "$browser_result"
  else
    browser_status=$?
    cat "$browser_result"
    exit "$browser_status"
  fi
  if test "$workload_mode" = product-composition; then
    browser_attestation='.result == "PASS" and .evidenceKind == "composition" and .workflowSelector == $selector'
  else
    browser_attestation='.result == "PASS" and .evidenceKind == "diagnostic-non-composition" and .diagnosticSelector == $selector'
  fi
  if ! jq -e --arg selector "$workflow_selector" "$browser_attestation" "$browser_result" >/dev/null; then
    printf 'Browser qualifier did not attest the exact target selector/mode: %s (%s).\n' "$workflow_selector" "$workload_mode" >&2
    exit 1
  fi
  printf '自动产品验收通过。\n'
else
  printf '\n==> 3/4 人工验收\n'
  printf '浏览器地址：%s\n' "$url"
  printf '请选择脚本已注册的 workspace：current-branch-acceptance-%s\n' "$run_id"
  printf '%s\n' \
    "1. 选择 current-branch-acceptance-$run_id 并创建 Session。" \
    "2. 只发送 ${workflow_selector}，确认出现可展开的 TASK_PROMPT_REQUIRED 完整诊断。" \
    "3. 发送 ${workflow_selector} + Task，确认中间 Action 只出现一次且带 Action 名称，最终回答以独立回答气泡展示；不得出现空 Completed 或 WSR_PRESENTATION_INVALID。" \
    '4. 确认 WSR Studio 紧跟 Delivery，且不会跳离当前 Session。' \
    '5. 检查 Studio 的 Task、metric、receipt、fact 与 trace。'
  printf '\n验收完成后按 Enter；脚本将自动执行第 4 步清理：'
  IFS= read -r _answer
fi

printf '\n==> 4/4 移除临时资产\n'
stage=completed
printf 'run=%s stage=%s\n' "$run_id" "$stage" >> "$lifecycle_log"
printf 'acceptanceTargetResult: %s\n' "$target_json"
