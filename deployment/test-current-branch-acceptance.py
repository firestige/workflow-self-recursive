#!/usr/bin/env python3
from __future__ import annotations

import os
import subprocess
import tempfile
import textwrap
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "deployment" / "accept-current-branch.sh"


def executable(path: Path, body: str) -> None:
    path.write_text("#!/bin/sh\nset -eu\n" + textwrap.dedent(body), encoding="utf-8")
    path.chmod(0o755)


class CurrentBranchAcceptanceTest(unittest.TestCase):
    def run_acceptance(
        self,
        *,
        fail_start: bool = False,
        no_open: bool = False,
        uninitialized_execution_system: bool = False,
        uninitialized_system_contracts: bool = False,
    ) -> tuple[subprocess.CompletedProcess[str], list[str], Path]:
        with tempfile.TemporaryDirectory(prefix="wsr-accept-test-") as temporary_name:
            temporary = Path(temporary_name)
            fake_bin = temporary / "bin"
            fake_bin.mkdir()
            log = temporary / "commands.log"
            preview_parent = temporary / "previews"
            preview_parent.mkdir()

            executable(fake_bin / "npm", """
                printf 'npm %s\n' "$*" >> "$WSR_ACCEPT_TEST_LOG"
                destination=
                previous=
                for argument in "$@"; do
                  if test "$previous" = --pack-destination; then destination=$argument; fi
                  previous=$argument
                done
                case " $* " in
                  *" --workspace dsh-wsr-execution "*) : > "$destination/dsh-wsr-execution-0.2.1.tgz" ;;
                  *" --workspace dsh-wsr-studio "*) : > "$destination/dsh-wsr-studio-0.1.1.tgz" ;;
                esac
            """)
            executable(fake_bin / "pnpm", """
                printf 'pnpm cwd=%s %s\n' "$PWD" "$*" >> "$WSR_ACCEPT_TEST_LOG"
                for argument in "$@"; do destination=$argument; done
                case " $* " in
                  *" release:artifacts "*) mkdir -p "$destination"; : > "$destination/wsr-execution-0.2.1.tgz" ;;
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
                printf 'node %s\n' "$*" >> "$WSR_ACCEPT_TEST_LOG"
                case " $* " in
                  *" start "*)
                    if test "${WSR_ACCEPT_TEST_FAIL_START:-0}" = 1; then exit 3; fi ;;
                esac
                printf '{"status":"succeeded"}\n'
            """)
            executable(fake_bin / "dsh", """
                printf 'dsh %s home=%s\n' "$*" "$DSH_HOME" >> "$WSR_ACCEPT_TEST_LOG"
            """)
            executable(fake_bin / "jq", """
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
                  *" rev-parse "*) printf 'abcdef12\n' ;;
                esac
            """)

            env = {
                **os.environ,
                "PATH": f"{fake_bin}:{os.environ['PATH']}",
                "WSR_ACCEPT_TEST_LOG": str(log),
                "WSR_ACCEPT_TMPDIR": str(preview_parent),
                "WSR_ACCEPT_TEST_FAIL_START": "1" if fail_start else "0",
                "WSR_ACCEPT_TEST_UNINITIALIZED_EXECUTION_SYSTEM": "1" if uninitialized_execution_system else "0",
                "WSR_ACCEPT_TEST_UNINITIALIZED_SYSTEM_CONTRACTS": "1" if uninitialized_system_contracts else "0",
                "WSR_ACCEPT_NO_OPEN": "1" if no_open else "0",
            }
            result = subprocess.run(
                [str(SCRIPT)],
                cwd=ROOT,
                env=env,
                input="\n",
                text=True,
                capture_output=True,
                check=False,
            )
            commands = log.read_text(encoding="utf-8").splitlines() if log.exists() else []
            remaining = list(preview_parent.iterdir())
            self.assertEqual(remaining, [], f"temporary assets remain: {remaining}")
            return result, commands, preview_parent

    def test_one_command_builds_local_assets_waits_for_acceptance_and_removes_everything(self) -> None:
        result, commands, _ = self.run_acceptance()

        self.assertEqual(result.returncode, 0, result.stderr)
        joined = "\n".join(commands)
        self.assertIn("--workspace dsh-wsr-execution", joined)
        self.assertIn("--workspace dsh-wsr-studio", joined)
        self.assertIn("pnpm cwd=", joined)
        self.assertIn("execution-system release:artifacts", joined)
        self.assertIn("deployment/published/build-bundle.py", joined)
        self.assertIn("deployment/bind-local-evidence-build.mjs", joined)
        self.assertIn("evolution-system", joined)
        self.assertIn(" setup ", f" {joined} ")
        self.assertIn(" install ", f" {joined} ")
        self.assertIn("qualify-local-provider-auth.mjs", joined)
        self.assertIn("dsh plugin --profile web remove --workspace-root dsh-wsr", joined)
        self.assertIn("wsr-execution-0.2.1.tgz", joined)
        self.assertIn("bind-local-package-candidate-cli.ts", joined)
        self.assertIn("wsr-execution 0.2.1", joined)
        self.assertIn("verify-local-core-install.mjs", joined)
        self.assertIn("dsh-wsr-execution-0.2.1.tgz", joined)
        self.assertIn("dsh-wsr-studio-0.1.1.tgz", joined)
        self.assertIn(" start ", f" {joined} ")
        self.assertNotIn("git init", joined)
        self.assertIn("register-acceptance-workspace.mjs", joined)
        self.assertIn("open http://127.0.0.1:13080", joined)
        self.assertIn(" stop ", f" {joined} ")
        self.assertIn("compose purge", joined)
        self.assertRegex(joined, r"compose purge volume=wsr-accept-[a-z0-9]+ project=wsr_accept_[a-z0-9]+")
        self.assertIn("验收完成后按 Enter", result.stdout)

    def test_start_failure_still_removes_isolated_assets(self) -> None:
        result, commands, _ = self.run_acceptance(fail_start=True)

        self.assertNotEqual(result.returncode, 0)
        joined = "\n".join(commands)
        self.assertIn(" start ", f" {joined} ")
        self.assertIn(" stop ", f" {joined} ")
        self.assertIn("compose purge", joined)
        self.assertNotIn("open http://127.0.0.1:13080", joined)

    def test_automation_can_suppress_browser_without_changing_the_lifecycle(self) -> None:
        result, commands, _ = self.run_acceptance(no_open=True)

        self.assertEqual(result.returncode, 0, result.stderr)
        joined = "\n".join(commands)
        self.assertNotIn("open http://127.0.0.1:13080", joined)
        self.assertIn(" start ", f" {joined} ")
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
