#!/usr/bin/env python3
from __future__ import annotations

import os
import json
import subprocess
import tempfile
import textwrap
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "deployment" / "accept-current-branch.sh"
RESOLVER = ROOT / "deployment" / "resolve-current-branch-target.mjs"


def executable(path: Path, body: str) -> None:
    path.write_text("#!/bin/sh\nset -eu\n" + textwrap.dedent(body), encoding="utf-8")
    path.chmod(0o755)


class CurrentBranchAcceptanceTest(unittest.TestCase):
    def test_target_resolver_returns_every_product_owned_coordinate(self) -> None:
        source = ROOT / "product-operations" / "manifests" / "product-0.5.13.json"
        result = subprocess.run(
            ["node", str(RESOLVER), str(source), str(ROOT / "release" / "compose")],
            text=True,
            capture_output=True,
            check=False,
        )

        self.assertEqual(result.returncode, 0, result.stderr)
        target = json.loads(result.stdout)
        self.assertEqual(target["productRelease"], "0.5.13")
        self.assertEqual(target["dsh"]["version"], "0.2.11")
        self.assertEqual(target["execution"]["version"], "0.2.6")
        self.assertEqual(target["services"]["version"], "0.1.7")
        self.assertEqual(target["workflow"], {
            "name": "implementation-workflow",
            "version": "0.4.12",
            "coordinate": "github-release://firestige/wsr-workflow-package/workflow-package/implementation-workflow/v0.4.12/workflow-package-implementation-workflow-0.4.12.tar.gz",
            "digest": "sha256:5aa8e1e0d5e1bc0f6d1a042db8a91244d88405f141b3fddd5ef1d4fd06ea4544",
        })
        self.assertEqual(target["providers"]["version"], "0.2.6")
        self.assertEqual(target["workload"], {"mode": "product-composition", "selector": "implementation-workflow@0.4.12"})

    def test_target_resolver_rejects_duplicate_authority_before_returning_coordinates(self) -> None:
        source = ROOT / "product-operations" / "manifests" / "product-0.5.13.json"
        manifest = json.loads(source.read_text(encoding="utf-8"))
        manifest["components"].append(dict(manifest["components"][1]))
        with tempfile.TemporaryDirectory(prefix="wsr-target-test-") as temporary_name:
            target = Path(temporary_name) / "duplicate.json"
            target.write_text(json.dumps(manifest), encoding="utf-8")
            result = subprocess.run(
                ["node", str(RESOLVER), str(target), str(ROOT / "release" / "compose")],
                text=True,
                capture_output=True,
                check=False,
            )

        self.assertEqual(result.returncode, 2)
        self.assertIn("components.services must occur exactly once", result.stderr)

    def test_target_resolver_rejects_a_coordinate_that_disagrees_with_its_version(self) -> None:
        source = ROOT / "product-operations" / "manifests" / "product-0.5.13.json"
        manifest = json.loads(source.read_text(encoding="utf-8"))
        services = next(component for component in manifest["components"] if component["id"] == "services")
        services["coordinate"] = services["coordinate"].replace("0.1.7", "0.1.6")
        with tempfile.TemporaryDirectory(prefix="wsr-target-test-") as temporary_name:
            target = Path(temporary_name) / "mismatch.json"
            target.write_text(json.dumps(manifest), encoding="utf-8")
            result = subprocess.run(
                ["node", str(RESOLVER), str(target), str(ROOT / "release" / "compose")],
                text=True,
                capture_output=True,
                check=False,
            )

        self.assertEqual(result.returncode, 2)
        self.assertIn("services.coordinate does not identify version 0.1.7", result.stderr)

    def run_acceptance(
        self,
        *,
        product_manifest: Path | None = ROOT / "product-operations" / "manifests" / "product-0.5.13.json",
        diagnostic_selector: str | None = None,
        run_id: str = "accepttest123",
        fail_start: bool = False,
        no_open: bool = False,
        uninitialized_execution_system: bool = False,
        uninitialized_system_contracts: bool = False,
        browser_qualification: bool = False,
        leaked_container: bool = False,
        transient_container_checks: int = 0,
        cleanup_requires_fallback: bool = False,
        manifest_mismatch: bool = False,
        preexisting_resources: bool = False,
    ) -> tuple[subprocess.CompletedProcess[str], list[str], list[str]]:
        with tempfile.TemporaryDirectory(prefix="wsr-accept-test-") as temporary_name:
            temporary = Path(temporary_name)
            fake_bin = temporary / "bin"
            fake_bin.mkdir()
            log = temporary / "commands.log"
            preview_parent = temporary / "previews"
            preview_parent.mkdir()

            executable(fake_bin / "npm", """
                printf 'npm cwd=%s %s\n' "$PWD" "$*" >> "$WSR_ACCEPT_TEST_LOG"
                destination=
                previous=
                for argument in "$@"; do
                  if test "$previous" = --pack-destination; then destination=$argument; fi
                  previous=$argument
                done
                case " $* " in
                  *" --workspace wsr-ui-core "*) : > "$destination/wsr-ui-core-0.1.0-rc.1.tgz" ;;
                  *" --workspace dsh-wsr-execution "*) : > "$destination/dsh-wsr-execution-0.2.9.tgz" ;;
                  *" --workspace dsh-wsr-studio "*) : > "$destination/dsh-wsr-studio-0.1.2.tgz" ;;
                  *" --workspace dsh-wsr "*) : > "$destination/dsh-wsr-0.2.9.tgz" ;;
                esac
            """)
            executable(fake_bin / "pnpm", """
                printf 'pnpm cwd=%s %s\n' "$PWD" "$*" >> "$WSR_ACCEPT_TEST_LOG"
                for argument in "$@"; do destination=$argument; done
                case " $* " in
                  *" release:artifacts "*) mkdir -p "$destination"; : > "$destination/wsr-execution-0.2.6.tgz" ;;
                esac
            """)
            executable(fake_bin / "python3", """
                if test "${1:-}" = -c; then
                  counter="$WSR_ACCEPT_TEST_LOG.ports"
                  value=0
                  if test -f "$counter"; then value=$(cat "$counter"); fi
                  value=$((value + 1))
                  printf '%s\n' "$value" > "$counter"
                  case "$value" in
                    1) printf '13080\n' ;;
                    2) printf '14318\n' ;;
                    *) printf '18000\n' ;;
                  esac
                  exit 0
                fi
                printf 'bundle %s\n' "$*" >> "$WSR_ACCEPT_TEST_LOG"
                output=$3
                mkdir -p "$output"
                cat > "$output/wsr-compose" <<'EOF'
#!/bin/sh
printf 'compose %s volume=%s project=%s\n' "$*" "${WSR_EVIDENCE_VOLUME:-}" "${COMPOSE_PROJECT_NAME:-}" >> "$WSR_ACCEPT_TEST_LOG"
EOF
                chmod +x "$output/wsr-compose"
            """)
            executable(fake_bin / "node", """
                printf 'node %s WSR_ACCEPT_WORKFLOW_SELECTOR=%s\n' "$*" "${WSR_ACCEPT_WORKFLOW_SELECTOR:-}" >> "$WSR_ACCEPT_TEST_LOG"
                case "${1:-}" in
                  */resolve-current-branch-target.mjs)
                    mode=product-composition
                    selector=implementation-workflow@0.4.12
                    if test "$#" -eq 4; then mode=diagnostic; selector=$4; fi
                    printf '{"productManifest":"%s/product-operations/manifests/product-0.5.13.json","productRelease":"0.5.13","dsh":{"version":"0.2.11"},"execution":{"name":"wsr-execution","version":"0.2.6"},"services":{"version":"0.1.7","composeManifest":"%s/release/compose/0.1.7.json"},"workflow":{"name":"implementation-workflow","version":"0.4.12"},"providers":{"version":"0.2.6"},"workload":{"mode":"%s","selector":"%s"}}\n' "$PWD" "$PWD" "$mode" "$selector"
                    exit 0 ;;
                esac
                case " $* " in
                  *qualify-current-source-browser.ts*)
                    printf '{"result":"PASS","selector":"%s","workloadMode":"product-composition"}\n' "${WSR_ACCEPT_WORKFLOW_SELECTOR:-}"
                    exit 0 ;;
                esac
                if test "${1:-}" = -e; then
                  printf 'abc123def456'
                  exit 0
                fi
                if test "${1:-}" = -p; then
                  case "${3:-}" in
                    */wsr-ui/packages/bi/package.json) printf '0.1.0-rc.1\n' ;;
                    */product-operations/package.json) printf '0.5.12\n' ;;
                    */execution-system/package.json) printf '0.2.6\n' ;;
                    */wsr-dsh/packages/execution/package.json) printf '0.2.9\n' ;;
                    */wsr-dsh/packages/studio/package.json) printf '0.1.2\n' ;;
                    */wsr-dsh/packages/suite/package.json) printf '0.2.9\n' ;;
                    *) exit 2 ;;
                  esac
                  exit 0
                fi
                case " $* " in
                  *local-manifest-consistency.mjs*)
                    if test "${WSR_ACCEPT_TEST_MANIFEST_MISMATCH:-0}" = 1; then
                      printf '%s\n' 'LOCAL_MANIFEST_CONSISTENCY: BLOCKED' >&2
                      exit 1
                    fi ;;
                  *" start "*)
                    if test "${WSR_ACCEPT_TEST_FAIL_START:-0}" = 1; then exit 3; fi ;;
                esac
                printf '{"status":"succeeded"}\n'
            """)
            executable(fake_bin / "dsh", """
                printf 'dsh %s home=%s\n' "$*" "$DSH_HOME" >> "$WSR_ACCEPT_TEST_LOG"
            """)
            executable(fake_bin / "jq", """
                case " $* " in
                  *components*services*version*) printf '0.1.6\n'; exit 0 ;;
                  *" .productManifest "*) printf '%s/product-operations/manifests/product-0.5.13.json\n' "$PWD"; exit 0 ;;
                  *" .productRelease "*) printf '0.5.13\n'; exit 0 ;;
                  *" .dsh.version "*) printf '0.2.11\n'; exit 0 ;;
                  *" .execution.name "*) printf 'wsr-execution\n'; exit 0 ;;
                  *" .execution.version "*) printf '0.2.6\n'; exit 0 ;;
                  *" .services.version "*) printf '0.1.7\n'; exit 0 ;;
                  *" .services.composeManifest "*) printf '%s/release/compose/0.1.7.json\n' "$PWD"; exit 0 ;;
                  *" .workflow.name "*) printf 'implementation-workflow\n'; exit 0 ;;
                  *" .workflow.version "*) printf '0.4.12\n'; exit 0 ;;
                  *" .providers.version "*) printf '0.2.6\n'; exit 0 ;;
                  *" .workload.mode "*)
                    case "$(command cat)" in *'"mode":"diagnostic"'*) printf 'diagnostic\n' ;; *) printf 'product-composition\n' ;; esac
                    exit 0 ;;
                  *" .workload.selector "*)
                    payload=$(command cat)
                    case "$payload" in *'"mode":"diagnostic"'*) printf 'hello-world-workflow@0.2.0\n' ;; *) printf 'implementation-workflow@0.4.12\n' ;; esac
                    exit 0 ;;
                  *workloadMode*selector*) exit 0 ;;
                esac
                if test "$#" -eq 0; then
                  command cat
                else
                  for argument in "$@"; do source=$argument; done
                  command cat "$source"
                fi
            """)
            executable(fake_bin / "open", """
                printf 'open %s\n' "$*" >> "$WSR_ACCEPT_TEST_LOG"
            """)
            executable(fake_bin / "docker", """
                printf 'docker %s\n' "$*" >> "$WSR_ACCEPT_TEST_LOG"
                case " $* " in
                  " ps -aq ")
                    if test "${WSR_ACCEPT_TEST_PREEXISTING_RESOURCES:-0}" = 1; then printf 'preexisting-container\n'; fi ;;
                  " network ls -q ")
                    if test "${WSR_ACCEPT_TEST_PREEXISTING_RESOURCES:-0}" = 1; then printf 'preexisting-network\n'; fi ;;
                  *" ps -aq "*)
                    counter="$WSR_ACCEPT_TEST_LOG.container-checks"
                    checks=0
                    if test -f "$counter"; then checks=$(cat "$counter"); fi
                    checks=$((checks + 1))
                    printf '%s\n' "$checks" > "$counter"
                    if test "${WSR_ACCEPT_TEST_LEAKED_CONTAINER:-0}" = 1 || \
                       { test "${WSR_ACCEPT_TEST_CLEANUP_REQUIRES_FALLBACK:-0}" = 1 && \
                         test ! -f "$WSR_ACCEPT_TEST_LOG.fallback-complete"; } || \
                       test "$checks" -le "${WSR_ACCEPT_TEST_TRANSIENT_CONTAINER_CHECKS:-0}"; then
                      printf 'leaked-container\n'
                    fi ;;
                  *" rm -f leaked-container "*) : > "$WSR_ACCEPT_TEST_LOG.fallback-complete" ;;
                  *" network ls -q "*) : ;;
                  *" volume inspect "*) exit 1 ;;
                  *" rm -f preexisting-container "*|*" network rm preexisting-network "*|*" volume rm -f preexisting-volume "*)
                    printf 'PREEXISTING_RESOURCE_REMOVAL_ATTEMPT\n' >&2
                    exit 9 ;;
                esac
            """)
            executable(fake_bin / "git", """
                printf 'git %s\n' "$*" >> "$WSR_ACCEPT_TEST_LOG"
                case " $* " in
                  *" submodule status -- execution-system "*)
                    if test "${WSR_ACCEPT_TEST_UNINITIALIZED_EXECUTION_SYSTEM:-0}" = 1; then
                      printf '%s\n' '-044bfe8 execution-system'
                    else
                      printf '%s\n' ' 044bfe8 execution-system'
                    fi ;;
                  *" submodule status -- evidence-system "*) printf '%s\n' '+5065cf8 evidence-system' ;;
                  *" submodule status -- evolution-system "*) printf '%s\n' '+b302595 evolution-system' ;;
                  *" submodule status -- system-contracts "*)
                    if test "${WSR_ACCEPT_TEST_UNINITIALIZED_SYSTEM_CONTRACTS:-0}" = 1; then
                      printf '%s\n' '-4ca07c0 system-contracts'
                    else
                      printf '%s\n' ' 4ca07c0 system-contracts'
                    fi ;;
                  *" submodule status -- wsr-dsh "*) printf '%s\n' '+408c837 wsr-dsh' ;;
                  *" submodule status -- wsr-ui "*) printf '%s\n' '+4122e29 wsr-ui' ;;
                  *" rev-parse "*) printf 'abcdef12\n' ;;
                esac
            """)

            env = {
                **os.environ,
                "PATH": f"{fake_bin}:{os.environ['PATH']}",
                "WSR_ACCEPT_TEST_LOG": str(log),
                "WSR_ACCEPT_TMPDIR": str(preview_parent),
                "WSR_ACCEPT_RUN_ID": run_id,
                "WSR_ACCEPT_TEST_FAIL_START": "1" if fail_start else "0",
                "WSR_ACCEPT_TEST_UNINITIALIZED_EXECUTION_SYSTEM": "1" if uninitialized_execution_system else "0",
                "WSR_ACCEPT_TEST_UNINITIALIZED_SYSTEM_CONTRACTS": "1" if uninitialized_system_contracts else "0",
                "WSR_ACCEPT_NO_OPEN": "1" if no_open else "0",
                "WSR_ACCEPT_BROWSER_QUALIFICATION": "1" if browser_qualification else "0",
                "WSR_ACCEPT_TEST_LEAKED_CONTAINER": "1" if leaked_container else "0",
                "WSR_ACCEPT_TEST_TRANSIENT_CONTAINER_CHECKS": str(transient_container_checks),
                "WSR_ACCEPT_TEST_CLEANUP_REQUIRES_FALLBACK": "1" if cleanup_requires_fallback else "0",
                "WSR_ACCEPT_CLEANUP_MAX_ATTEMPTS": "5",
                "WSR_ACCEPT_CLEANUP_POLL_SECONDS": "0",
                "WSR_ACCEPT_TEST_MANIFEST_MISMATCH": "1" if manifest_mismatch else "0",
                "WSR_ACCEPT_TEST_PREEXISTING_RESOURCES": "1" if preexisting_resources else "0",
            }
            arguments = [str(SCRIPT)]
            if product_manifest is not None:
                arguments.extend(["--product-manifest", str(product_manifest)])
            if diagnostic_selector is not None:
                arguments.extend(["--diagnostic-selector", diagnostic_selector])
            result = subprocess.run(
                arguments,
                cwd=ROOT,
                env=env,
                input="\n",
                text=True,
                capture_output=True,
                check=False,
            )
            commands = log.read_text(encoding="utf-8").splitlines() if log.exists() else []
            remaining = [path.name for path in preview_parent.iterdir()]
            return result, commands, remaining

    def test_one_command_builds_local_assets_waits_for_acceptance_and_removes_everything(self) -> None:
        result, commands, remaining = self.run_acceptance()

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(remaining, [])
        self.assertIn("CURRENT_SOURCE_COMPOSITION (not published-coordinate evidence)", result.stdout)
        self.assertIn("workloadMode: product-composition", result.stdout)
        self.assertIn("product.release: 0.5.13", result.stdout)
        self.assertIn("dsh-bundle: 0.2.11", result.stdout)
        self.assertIn("execution-owner: wsr-execution@0.2.6", result.stdout)
        self.assertIn("services/compose: 0.1.7", result.stdout)
        self.assertIn("workflow-source: implementation-workflow@0.4.12", result.stdout)
        self.assertIn("providers: 0.2.6", result.stdout)
        self.assertIn("resolvedTarget:", result.stdout)
        joined = "\n".join(commands)
        self.assertRegex(joined, r"npm cwd=.*/wsr-ui run build")
        self.assertIn("--workspace wsr-ui-core", joined)
        self.assertIn("wsr-ui-core-0.1.0-rc.1.tgz", joined)
        self.assertIn("bind-local-package-candidate.mjs", joined)
        self.assertIn("--install", joined)
        self.assertIn("--verify", joined)
        self.assertIn("--workspace dsh-wsr-execution", joined)
        self.assertIn("--workspace dsh-wsr-studio", joined)
        self.assertIn("--workspace dsh-wsr", joined)
        self.assertIn("prepare-local-dsh-acceptance.mjs", joined)
        self.assertIn("local-manifest-consistency.mjs", joined)
        self.assertIn("product-operations/manifests/product-0.5.13.json", joined)
        self.assertIn("release/compose/0.1.7.json", joined)
        self.assertIn("pnpm cwd=", joined)
        self.assertIn("execution-system release:artifacts", joined)
        self.assertIn("deployment/published/build-bundle.py", joined)
        self.assertIn("deployment/bind-local-evidence-build.mjs", joined)
        self.assertIn("evolution-system", joined)
        self.assertIn(" setup ", f" {joined} ")
        self.assertIn(" install ", f" {joined} ")
        self.assertIn("qualify-local-provider-auth.mjs", joined)
        self.assertNotIn("dsh plugin --profile web remove --workspace-root dsh-wsr", joined)
        self.assertIn("wsr-execution-0.2.6.tgz", joined)
        self.assertNotIn("bind-local-package-candidate-cli.ts", joined)
        self.assertIn("verify-local-core-install.mjs", joined)
        self.assertIn("dsh-wsr-execution-0.2.9.tgz", joined)
        self.assertIn("dsh-wsr-studio-0.1.2.tgz", joined)
        self.assertIn("dsh-wsr-0.2.9.tgz", joined)
        self.assertRegex(joined, r"product-operations/bin/wsr\.mjs install .*--manifest .*compatibility\.json")
        self.assertIn(" start ", f" {joined} ")
        self.assertNotIn("git init", joined)
        self.assertIn("register-acceptance-workspace.mjs", joined)
        self.assertIn("open http://127.0.0.1:13080", joined)
        self.assertIn(" stop ", f" {joined} ")
        self.assertIn("compose purge", joined)
        self.assertIn("compose purge volume=wsr-evidence-accepttest123 project=wsr_services_accepttest123", joined)
        self.assertIn("docker ps -aq --filter label=com.docker.compose.project=wsr_services_accepttest123", joined)
        self.assertIn("docker network ls -q --filter label=com.docker.compose.project=wsr_services_accepttest123", joined)
        self.assertIn("docker volume inspect wsr-evidence-accepttest123", joined)
        self.assertIn("验收完成后按 Enter", result.stdout)

    def test_explicit_product_manifest_is_required_before_any_deployment_side_effect(self) -> None:
        result, commands, remaining = self.run_acceptance(product_manifest=None)

        self.assertEqual(result.returncode, 2)
        self.assertIn("--product-manifest", result.stderr)
        self.assertEqual(commands, [])
        self.assertEqual(remaining, [])

    def test_explicit_diagnostic_selector_is_marked_non_composition(self) -> None:
        result, commands, remaining = self.run_acceptance(diagnostic_selector="hello-world-workflow@0.2.0")

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(remaining, [])
        self.assertIn("workloadMode: diagnostic (NON_COMPOSITION_EVIDENCE)", result.stdout)
        self.assertIn("workflow-selector: hello-world-workflow@0.2.0", result.stdout)
        self.assertIn("WSR_ACCEPT_WORKFLOW_SELECTOR=hello-world-workflow@0.2.0", "\n".join(commands))

    def test_two_runs_use_disjoint_state_workspace_compose_and_volume_names(self) -> None:
        first, first_commands, first_remaining = self.run_acceptance(run_id="acceptfirst1")
        second, second_commands, second_remaining = self.run_acceptance(run_id="acceptsecond2")

        self.assertEqual(first.returncode, 0, first.stderr)
        self.assertEqual(second.returncode, 0, second.stderr)
        self.assertEqual(first_remaining, [])
        self.assertEqual(second_remaining, [])
        first_log = "\n".join(first_commands)
        second_log = "\n".join(second_commands)
        self.assertIn("wsr_services_acceptfirst1", first_log)
        self.assertIn("wsr-evidence-acceptfirst1", first_log)
        self.assertIn("current-branch-acceptance-acceptfirst1", first_log)
        self.assertNotIn("acceptsecond2", first_log)
        self.assertIn("wsr_services_acceptsecond2", second_log)
        self.assertIn("wsr-evidence-acceptsecond2", second_log)
        self.assertIn("current-branch-acceptance-acceptsecond2", second_log)
        self.assertNotIn("acceptfirst1", second_log)

    def test_cleanup_fails_closed_when_an_isolated_container_remains(self) -> None:
        result, commands, remaining = self.run_acceptance(leaked_container=True)

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("验收清理不完整", result.stderr)
        self.assertEqual(len(remaining), 1)
        self.assertIn("docker ps -aq --filter label=com.docker.compose.project=wsr_services_accepttest123", "\n".join(commands))

    def test_cleanup_waits_for_isolated_resources_to_converge(self) -> None:
        result, commands, _ = self.run_acceptance(transient_container_checks=2)

        self.assertEqual(result.returncode, 0, result.stderr)
        container_checks = [command for command in commands if "docker ps -aq " in command]
        self.assertEqual(len(container_checks), 3)

    def test_cleanup_uses_targeted_fallback_after_convergence_timeout(self) -> None:
        result, commands, remaining = self.run_acceptance(cleanup_requires_fallback=True)

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("docker rm -f leaked-container", "\n".join(commands))
        self.assertEqual(remaining, [])

    def test_cleanup_never_targets_resources_outside_the_run_identity(self) -> None:
        result, commands, remaining = self.run_acceptance(preexisting_resources=True)

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(remaining, [])
        joined = "\n".join(commands)
        self.assertNotIn("preexisting-container", joined)
        self.assertNotIn("preexisting-network", joined)
        self.assertNotIn("preexisting-volume", joined)
        self.assertNotIn("docker container prune", joined)
        self.assertNotIn("docker network prune", joined)
        self.assertNotIn("docker volume prune", joined)

    def test_manifest_mismatch_stops_before_setup_or_install(self) -> None:
        result, commands, _ = self.run_acceptance(manifest_mismatch=True)

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("LOCAL_MANIFEST_CONSISTENCY: BLOCKED", result.stderr)
        joined = "\n".join(commands)
        self.assertIn("local-manifest-consistency.mjs", joined)
        self.assertNotRegex(joined, r"product-operations/bin/wsr\.mjs (setup|install)")

    def test_start_failure_still_removes_isolated_assets(self) -> None:
        result, commands, remaining = self.run_acceptance(fail_start=True)

        self.assertNotEqual(result.returncode, 0)
        joined = "\n".join(commands)
        self.assertIn(" start ", f" {joined} ")
        self.assertIn(" stop ", f" {joined} ")
        self.assertIn("compose purge", joined)
        self.assertNotIn("open http://127.0.0.1:13080", joined)
        self.assertEqual(len(remaining), 1)
        self.assertRegex(remaining[0], r"^wsr-acceptance-failure-accepttest123$")
        self.assertIn("失败证据已封存", result.stderr)

    def test_automation_can_suppress_browser_without_changing_the_lifecycle(self) -> None:
        result, commands, _ = self.run_acceptance(no_open=True)

        self.assertEqual(result.returncode, 0, result.stderr)
        joined = "\n".join(commands)
        self.assertNotIn("open http://127.0.0.1:13080", joined)
        self.assertIn(" start ", f" {joined} ")
        self.assertIn("compose purge", joined)

    def test_browser_qualification_replaces_the_manual_pause_and_receives_real_service_endpoints(self) -> None:
        result, commands, _ = self.run_acceptance(no_open=True, browser_qualification=True)

        self.assertEqual(result.returncode, 0, result.stderr)
        joined = "\n".join(commands)
        self.assertIn("qualify-current-source-browser.ts", joined)
        self.assertIn("http://127.0.0.1:13080", joined)
        self.assertIn("http://127.0.0.1:14318", joined)
        self.assertIn("current-branch-acceptance", joined)
        self.assertIn("WSR_ACCEPT_WORKFLOW_SELECTOR=implementation-workflow@0.4.12", joined)
        self.assertNotIn("验收完成后按 Enter", result.stdout)
        self.assertIn('"selector":"implementation-workflow@0.4.12"', result.stdout)
        self.assertIn("自动产品验收通过", result.stdout)
        self.assertIn("compose purge", joined)

    def test_initializes_only_a_missing_submodule_before_building(self) -> None:
        result, commands, _ = self.run_acceptance(uninitialized_execution_system=True)

        self.assertEqual(result.returncode, 0, result.stderr)
        joined = "\n".join(commands)
        self.assertIn("submodule update --init -- execution-system", joined)
        self.assertNotIn("submodule update --init -- wsr-dsh", joined)
        self.assertIn("execution-system release:artifacts", joined)

    def test_initializes_the_contract_source_required_by_the_evolution_image(self) -> None:
        result, commands, _ = self.run_acceptance(uninitialized_system_contracts=True)

        self.assertEqual(result.returncode, 0, result.stderr)
        joined = "\n".join(commands)
        self.assertIn("submodule update --init -- system-contracts", joined)
        self.assertNotIn("submodule update --init -- execution-system", joined)
        self.assertIn("evolution-system", joined)


if __name__ == "__main__":
    unittest.main()
