#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import os
import subprocess
import tempfile
import time
import unittest
from pathlib import Path


ROOT = Path(__file__).parents[1]
PUBLISHED = ROOT / "deployment" / "published"
GENERATOR = PUBLISHED / "build-bundle.py"
FINAL_MANIFEST = ROOT / "release" / "compose" / "0.1.1.json"

SHA = "a" * 64


def manifest(version: str = "0.1.0") -> dict[str, object]:
    return {
        "schemaVersion": "wsr.compose-release@1.0.0",
        "version": version,
        "supportedPlatforms": ["linux/amd64", "linux/arm64"],
        "schemaCompatibility": {
            "evidenceRevision": "20260826_0003",
            "reads": ["20260826_0003"],
        },
        "hostIntegration": {
            "schemaVersion": "wsr.loopback-host@1.0.0",
            "evidenceQueryRevision": "0.1.0",
            "evidenceTaskQueryRevision": "1.0.0",
            "evolutionComputeRevision": "1",
        },
        "images": {
            "postgres": {
                "coordinate": f"postgres:18.4-bookworm@sha256:{SHA}",
                "source": "https://github.com/docker-library/postgres",
                "provenance": "https://hub.docker.com/_/postgres",
            },
            "evidence": {
                "coordinate": f"ghcr.io/firestige/wsr-evidence:0.1.0@sha256:{SHA}",
                "source": "https://github.com/firestige/wsr-evidence",
                "provenance": "https://github.com/firestige/wsr-evidence/attestations",
            },
            "evolution": {
                "coordinate": f"ghcr.io/firestige/wsr-evolution:0.1.0@sha256:{SHA}",
                "source": "https://github.com/firestige/wsr-evolution",
                "provenance": "https://github.com/firestige/wsr-evolution/attestations",
            },
        },
    }


class PublishedBundleTest(unittest.TestCase):
    def build(self, root: Path, value: dict[str, object] | None = None) -> Path:
        source = root / "release.json"
        target = root / "bundle"
        source.write_text(json.dumps(value or manifest()), encoding="utf-8")
        subprocess.run([str(GENERATOR), str(source), str(target)], check=True)
        return target

    def test_generator_emits_only_exact_published_service_images(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            bundle = self.build(Path(temporary))
            compose = (bundle / "compose.yaml").read_text(encoding="utf-8")

            self.assertEqual(compose.count("@sha256:"), 4)
            self.assertNotIn("build:", compose)
            self.assertNotIn("../evidence-system", compose)
            self.assertNotIn("../evolution-system", compose)
            self.assertNotIn("bi-app", compose)
            self.assertNotIn("workflow-builder", compose)
            self.assertIn('127.0.0.1:${WSR_EVIDENCE_PORT:-4318}:4318', compose)
            self.assertIn('127.0.0.1:${WSR_EVOLUTION_PORT:-8000}:8000', compose)
            self.assertIn("${WSR_EVOLUTION_CONFIG_FILE:-./evolution.config.json}", compose)
            self.assertTrue((bundle / "wsr-host-preflight.mjs").is_file())
            endpoint_template = json.loads(
                (bundle / "host-endpoints.template.json").read_text(encoding="utf-8")
            )
            self.assertEqual(endpoint_template["schemaVersion"], "wsr.loopback-host@1.0.0")
            self.assertEqual(
                endpoint_template["services"]["evidence"]["contracts"],
                [
                    {"name": "evidence.query", "revision": "0.1.0", "operations": ["facts/read", "traces/read"]},
                    {"name": "evidence.query", "revision": "1.0.0", "operations": ["tasks/list"]},
                ],
            )
            self.assertEqual(
                endpoint_template["services"]["evolution"]["contracts"],
                [{"name": "evolution.compute", "revision": "1", "operations": ["evaluations/compute"]}],
            )

    def test_final_release_manifest_binds_the_qualified_image_set(self) -> None:
        release = json.loads(FINAL_MANIFEST.read_text(encoding="utf-8"))

        self.assertEqual(release["version"], "0.1.1")
        self.assertEqual(
            release["images"]["postgres"]["coordinate"],
            "postgres:18.4-bookworm@sha256:882236b897e39051d2368c5ccc6cda944904723506b2dfc97f2a8f5bc9afa382",
        )
        self.assertEqual(
            release["images"]["evidence"]["coordinate"],
            "ghcr.io/firestige/wsr-evidence:0.1.0-rc.3@sha256:5ce1574260677b5fdfcecacae872a53f0e080092b0c375ddee1216479f18c542",
        )
        self.assertEqual(
            release["images"]["evolution"]["coordinate"],
            "ghcr.io/firestige/wsr-evolution:0.1.0-rc.1@sha256:41e244d68f588d8b0a4789488a694c55e2034e36f4a152638e026c03dde1a14f",
        )
        self.assertEqual(release["schemaCompatibility"]["evidenceRevision"], "20260828_0004")
        self.assertEqual(
            release["images"]["evidence"]["provenance"],
            "https://github.com/firestige/wsr-evidence/releases/download/0.1.0-rc.3/release-qualification.json",
        )
        self.assertEqual(
            release["images"]["evidence"]["qualificationSha256"],
            "sha256:003d79bd8ea1a67eeff455b39067620bdeceaa2a198343c85eb7e8d9e371135b",
        )
        self.assertEqual(
            release["images"]["evidence"]["source"],
            "https://github.com/firestige/wsr-evidence/tree/35d63469650e978d0fb795419df5d4a0ea5eafa7",
        )
        self.assertEqual(
            release["images"]["evolution"]["provenance"],
            "https://github.com/firestige/wsr-evolution/releases/download/0.1.0-rc.1/release-qualification.json",
        )
        self.assertEqual(
            release["images"]["evolution"]["qualificationSha256"],
            "sha256:d8ca8329e5daed92fbab442305ccb3de9c0444edba2147a38027e867b46c642b",
        )

        with tempfile.TemporaryDirectory() as temporary:
            bundle = self.build(Path(temporary), release)
            compose = (bundle / "compose.yaml").read_text(encoding="utf-8")
            launcher = (bundle / "wsr-compose").read_text(encoding="utf-8")

        self.assertEqual(compose.count("@sha256:"), 4)
        self.assertNotIn("build:", compose)
        self.assertNotIn("../evidence-system", compose)
        self.assertNotIn("../evolution-system", compose)
        self.assertIn("condition: service_completed_successfully", compose)
        self.assertIn("condition: service_healthy", compose)
        self.assertIn("WSR_EVIDENCE_STATE_IDENTITY", compose)
        start_stack = launcher.split("start_stack() {", 1)[1].split("}", 1)[0]
        self.assertLess(start_stack.index("compose pull"), start_stack.index("wait_stack"))
        self.assertIn("--force-recreate database", start_stack)
        self.assertLess(start_stack.index("database"), start_stack.index("10-wsr-roles.sh"))
        self.assertLess(start_stack.index("10-wsr-roles.sh"), start_stack.index("wait_stack"))
        self.assertIn("compose rm -sf migrate evidence evolution", start_stack)
        self.assertIn("start | upgrade | rollback) recoverable_start_stack", launcher)
        self.assertIn("io.wsr.state-identity", compose)
        self.assertNotIn("down --volumes", launcher)

    def test_generator_rejects_tags_without_digest_and_incompatible_schema(self) -> None:
        for mutate in ("tag", "schema", "host-contract"):
            with self.subTest(mutate=mutate), tempfile.TemporaryDirectory() as temporary:
                value = manifest()
                if mutate == "tag":
                    value["images"]["evolution"]["coordinate"] = (  # type: ignore[index]
                        "ghcr.io/firestige/wsr-evolution:0.1.0"
                    )
                elif mutate == "schema":
                    value["schemaCompatibility"]["reads"] = ["other"]  # type: ignore[index]
                else:
                    value["hostIntegration"]["evidenceQueryRevision"] = "2.0.0"  # type: ignore[index]
                source = Path(temporary) / "release.json"
                source.write_text(json.dumps(value), encoding="utf-8")
                completed = subprocess.run(
                    [str(GENERATOR), str(source), str(Path(temporary) / "bundle")],
                    capture_output=True,
                    text=True,
                )
                self.assertNotEqual(completed.returncode, 0)

    def test_compose_closes_database_network_and_credentials(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            bundle = self.build(Path(temporary))
            compose = (bundle / "compose.yaml").read_text(encoding="utf-8")
            normalized = subprocess.run(
                ["docker", "compose", "-f", str(bundle / "compose.yaml"), "config", "--format", "json"],
                check=True,
                capture_output=True,
                text=True,
            )
            services = json.loads(normalized.stdout)["services"]

            self.assertEqual(set(services), {"database", "migrate", "evidence", "evolution"})
            self.assertEqual(set(services["database"]["networks"]), {"evidence-db"})
            self.assertEqual(set(services["evolution"]["networks"]), {"app-tier"})
            self.assertNotIn("secrets", services["evolution"])
            self.assertNotRegex(compose.split("  evolution:\n", 1)[1], r"WSR_EVIDENCE_DATABASE|POSTGRES")
            self.assertNotIn("ports", services["database"])
            self.assertNotIn("ports", services["migrate"])
            for name in ("evidence", "evolution"):
                self.assertEqual(services[name]["ports"][0]["host_ip"], "127.0.0.1")

    def test_launcher_preserves_secrets_and_volume_and_purge_is_explicit(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            temporary_root = Path(temporary)
            bundle = self.build(temporary_root)
            fake_bin = temporary_root / "bin"
            fake_bin.mkdir()
            log = temporary_root / "docker.log"
            docker = fake_bin / "docker"
            docker.write_text(
                "#!/bin/sh\nprintf '%s\\n' \"$*\" >>\"$WSR_TEST_DOCKER_LOG\"\nexit 0\n",
                encoding="utf-8",
            )
            docker.chmod(0o755)
            state = temporary_root / "state"
            environment = os.environ | {
                "PATH": f"{fake_bin}:{os.environ['PATH']}",
                "WSR_TEST_DOCKER_LOG": str(log),
                "WSR_LOCAL_STATE_DIR": str(state),
            }

            subprocess.run([str(bundle / "wsr-compose"), "start"], env=environment, check=True)
            password = (state / "secrets" / "admin-password").read_bytes()
            identity = (state / "service-state-identity").read_text(encoding="utf-8").strip()
            self.assertEqual(len(identity), 64)
            subprocess.run([str(bundle / "wsr-compose"), "restart"], env=environment, check=True)
            self.assertEqual((state / "secrets" / "admin-password").read_bytes(), password)
            self.assertEqual((state / "service-state-identity").read_text(encoding="utf-8").strip(), identity)
            subprocess.run([str(bundle / "wsr-compose"), "stop"], env=environment, check=True)
            subprocess.run([str(bundle / "wsr-compose"), "upgrade"], env=environment, check=True)
            subprocess.run([str(bundle / "wsr-compose"), "rollback"], env=environment, check=True)
            self.assertEqual((state / "secrets" / "admin-password").read_bytes(), password)
            self.assertEqual((state / "service-state-identity").read_text(encoding="utf-8").strip(), identity)
            subprocess.run([str(bundle / "wsr-compose"), "down"], env=environment, check=True)
            denied = subprocess.run([str(bundle / "wsr-compose"), "purge"], env=environment)
            self.assertNotEqual(denied.returncode, 0)
            subprocess.run(
                [str(bundle / "wsr-compose"), "purge"],
                env=environment | {"WSR_CONFIRM_PURGE": "DELETE_EVIDENCE_DATA"},
                check=True,
            )
            commands = log.read_text(encoding="utf-8")
            self.assertNotIn("down --volumes", commands)
            self.assertIn("up -d --wait", commands)
            self.assertIn("--force-recreate database", commands)
            self.assertIn("exec -T database /docker-entrypoint-initdb.d/10-wsr-roles.sh", commands)
            self.assertIn("rm -sf migrate evidence evolution", commands)
            self.assertIn("compose.yaml restart database", commands)
            self.assertIn("compose.yaml restart evidence evolution", commands)
            self.assertIn("compose.yaml stop", commands)
            self.assertIn("volume rm wsr-evidence-data", commands)

    def test_role_bootstrap_reconciles_all_managed_passwords_and_binds_the_volume_to_state(self) -> None:
        source = (PUBLISHED / "init-roles.sh").read_text(encoding="utf-8")
        self.assertIn("WSR_EVIDENCE_ADMIN_PASSWORD_FILE", source)
        self.assertIn("WSR_EVIDENCE_STATE_IDENTITY", source)
        self.assertIn(".wsr-state-identity", source)
        self.assertIn("ALTER ROLE wsr_evidence_admin", source)
        self.assertIn("ALTER ROLE wsr_evidence_runtime", source)
        self.assertIn("ALTER ROLE wsr_evidence_backup", source)

    def test_partial_start_failure_prints_status_and_logs(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            temporary_root = Path(temporary)
            bundle = self.build(temporary_root)
            fake_bin = temporary_root / "bin"
            fake_bin.mkdir()
            log = temporary_root / "docker.log"
            docker = fake_bin / "docker"
            docker.write_text(
                "#!/bin/sh\nprintf '%s\\n' \"$*\" >>\"$WSR_TEST_DOCKER_LOG\"\n"
                "case \"$*\" in *'up --wait'*) exit 19;; esac\nexit 0\n",
                encoding="utf-8",
            )
            docker.chmod(0o755)
            completed = subprocess.run(
                [str(bundle / "wsr-compose"), "start"],
                env=os.environ
                | {
                    "PATH": f"{fake_bin}:{os.environ['PATH']}",
                    "WSR_LOCAL_STATE_DIR": str(temporary_root / "state"),
                    "WSR_TEST_DOCKER_LOG": str(log),
                },
                capture_output=True,
                text=True,
            )
            self.assertEqual(completed.returncode, 19)
            self.assertIn("Published service stack did not become ready", completed.stderr)
            commands = log.read_text(encoding="utf-8")
            self.assertIn("compose.yaml down --remove-orphans", commands)
            self.assertNotIn("volume rm", commands)

    def test_service_operation_is_retryable_after_compensating_a_partial_runtime(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            temporary_root = Path(temporary)
            bundle = self.build(temporary_root)
            fake_bin = temporary_root / "bin"
            fake_bin.mkdir()
            log = temporary_root / "docker.log"
            interrupted = temporary_root / "interrupted"
            docker = fake_bin / "docker"
            docker.write_text(
                "#!/bin/sh\nprintf '%s\\n' \"$*\" >>\"$WSR_TEST_DOCKER_LOG\"\n"
                "case \"$*\" in\n"
                "  *'up --wait'*)\n"
                "    if ! test -f \"$WSR_TEST_INTERRUPTED\"; then\n"
                "      touch \"$WSR_TEST_INTERRUPTED\"\n"
                "      exit 19\n"
                "    fi\n"
                "    ;;\n"
                "esac\n"
                "exit 0\n",
                encoding="utf-8",
            )
            docker.chmod(0o755)
            environment = os.environ | {
                "PATH": f"{fake_bin}:{os.environ['PATH']}",
                "WSR_LOCAL_STATE_DIR": str(temporary_root / "state"),
                "WSR_TEST_DOCKER_LOG": str(log),
                "WSR_TEST_INTERRUPTED": str(interrupted),
            }

            first = subprocess.run([str(bundle / "wsr-compose"), "upgrade"], env=environment)
            second = subprocess.run([str(bundle / "wsr-compose"), "upgrade"], env=environment)

            self.assertEqual(first.returncode, 19)
            self.assertEqual(second.returncode, 0)
            commands = log.read_text(encoding="utf-8")
            self.assertEqual(commands.count("down --remove-orphans"), 1)
            self.assertNotIn("volume rm", commands)

    def test_service_operation_compensates_every_internal_effect_boundary(self) -> None:
        cases = (
            (" pull", False),
            ("--force-recreate database", True),
            ("exec -T database", True),
            ("rm -sf migrate", True),
            ("up --wait --wait-timeout", True),
        )
        for failure, expects_compensation in cases:
            with self.subTest(failure=failure), tempfile.TemporaryDirectory() as temporary:
                temporary_root = Path(temporary)
                bundle = self.build(temporary_root)
                fake_bin = temporary_root / "bin"
                fake_bin.mkdir()
                log = temporary_root / "docker.log"
                docker = fake_bin / "docker"
                docker.write_text(
                    "#!/bin/sh\nprintf '%s\\n' \"$*\" >>\"$WSR_TEST_DOCKER_LOG\"\n"
                    "case \"$*\" in *\"$WSR_TEST_FAIL_PATTERN\"*) exit 23;; esac\nexit 0\n",
                    encoding="utf-8",
                )
                docker.chmod(0o755)
                completed = subprocess.run(
                    [str(bundle / "wsr-compose"), "upgrade"],
                    env=os.environ
                    | {
                        "PATH": f"{fake_bin}:{os.environ['PATH']}",
                        "WSR_LOCAL_STATE_DIR": str(temporary_root / "state"),
                        "WSR_TEST_DOCKER_LOG": str(log),
                        "WSR_TEST_FAIL_PATTERN": failure,
                    },
                )
                self.assertEqual(completed.returncode, 23)
                commands = log.read_text(encoding="utf-8")
                self.assertEqual("down --remove-orphans" in commands, expects_compensation)
                self.assertNotIn("volume rm", commands)

    def test_services_owner_bounds_a_compose_process_that_never_returns(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            temporary_root = Path(temporary)
            bundle = self.build(temporary_root)
            fake_bin = temporary_root / "bin"
            fake_bin.mkdir()
            docker = fake_bin / "docker"
            docker.write_text(
                "#!/bin/sh\ncase \"$*\" in *' pull') sleep 5;; esac\nexit 0\n",
                encoding="utf-8",
            )
            docker.chmod(0o755)
            started = time.monotonic()

            completed = subprocess.run(
                [str(bundle / "wsr-compose"), "upgrade"],
                env=os.environ
                | {
                    "PATH": f"{fake_bin}:{os.environ['PATH']}",
                    "WSR_LOCAL_STATE_DIR": str(temporary_root / "state"),
                    "WSR_COMPOSE_TIMEOUT_SECONDS": "1",
                },
                capture_output=True,
                text=True,
            )

            self.assertEqual(completed.returncode, 124)
            self.assertLess(time.monotonic() - started, 4)
            self.assertIn("exceeded 1 seconds", completed.stderr)

    def test_services_owner_rejects_a_foreign_volume_identity_before_pull(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            temporary_root = Path(temporary)
            bundle = self.build(temporary_root)
            fake_bin = temporary_root / "bin"
            fake_bin.mkdir()
            log = temporary_root / "docker.log"
            docker = fake_bin / "docker"
            docker.write_text(
                "#!/bin/sh\nprintf '%s\\n' \"$*\" >>\"$WSR_TEST_DOCKER_LOG\"\n"
                "case \"$*\" in\n"
                "  *'volume inspect'* ) printf '{\"io.wsr.state-identity\":\"%s\"}\\n' \"$(printf b%.0s $(seq 1 64))\";;\n"
                "esac\nexit 0\n",
                encoding="utf-8",
            )
            docker.chmod(0o755)
            state = temporary_root / "state"
            state.mkdir()
            (state / "service-state-identity").write_text("a" * 64 + "\n", encoding="utf-8")

            completed = subprocess.run(
                [str(bundle / "wsr-compose"), "upgrade"],
                env=os.environ
                | {
                    "PATH": f"{fake_bin}:{os.environ['PATH']}",
                    "WSR_LOCAL_STATE_DIR": str(state),
                    "WSR_EVIDENCE_VOLUME": "wsr-evidence-foreign-test",
                    "WSR_TEST_DOCKER_LOG": str(log),
                },
                capture_output=True,
                text=True,
            )

            self.assertEqual(completed.returncode, 20)
            self.assertIn("different WSR state directory", completed.stderr)
            commands = log.read_text(encoding="utf-8")
            self.assertIn("volume inspect wsr-evidence-foreign-test", commands)
            self.assertNotIn(" pull", commands)

    def test_services_abort_can_remove_partial_runtime_despite_a_foreign_volume_label(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            temporary_root = Path(temporary)
            bundle = self.build(temporary_root)
            fake_bin = temporary_root / "bin"
            fake_bin.mkdir()
            log = temporary_root / "docker.log"
            docker = fake_bin / "docker"
            docker.write_text(
                "#!/bin/sh\nprintf '%s\\n' \"$*\" >>\"$WSR_TEST_DOCKER_LOG\"\n"
                "case \"$*\" in\n"
                "  *'volume inspect'* ) printf '{\"io.wsr.state-identity\":\"%s\"}\\n' \"$(printf b%.0s $(seq 1 64))\";;\n"
                "esac\nexit 0\n",
                encoding="utf-8",
            )
            docker.chmod(0o755)
            state = temporary_root / "state"
            state.mkdir()
            (state / "service-state-identity").write_text("a" * 64 + "\n", encoding="utf-8")

            completed = subprocess.run(
                [str(bundle / "wsr-compose"), "down"],
                env=os.environ
                | {
                    "PATH": f"{fake_bin}:{os.environ['PATH']}",
                    "WSR_LOCAL_STATE_DIR": str(state),
                    "WSR_EVIDENCE_VOLUME": "wsr-evidence-foreign-test",
                    "WSR_TEST_DOCKER_LOG": str(log),
                },
                capture_output=True,
                text=True,
            )

            self.assertEqual(completed.returncode, 0, completed.stderr)
            self.assertIn("down --remove-orphans", log.read_text(encoding="utf-8"))

    def test_launcher_rejects_closed_port_and_timeout_bounds_before_docker(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            temporary_root = Path(temporary)
            bundle = self.build(temporary_root)
            for variable, value in (
                ("WSR_EVIDENCE_PORT", "0"),
                ("WSR_EVOLUTION_PORT", "65536"),
                ("WSR_READY_TIMEOUT_SECONDS", "0"),
            ):
                with self.subTest(variable=variable, value=value):
                    completed = subprocess.run(
                        [str(bundle / "wsr-compose"), "start"],
                        env=os.environ | {variable: value},
                        capture_output=True,
                        text=True,
                    )
                    self.assertEqual(completed.returncode, 2)

    def test_host_config_uses_one_loopback_endpoint_for_studio_and_observation(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            temporary_root = Path(temporary)
            bundle = self.build(temporary_root)
            completed = subprocess.run(
                [str(bundle / "wsr-compose"), "host-config"],
                env=os.environ | {
                    "WSR_EVIDENCE_PORT": "14318",
                    "WSR_EVOLUTION_PORT": "18000",
                },
                capture_output=True,
                text=True,
                check=True,
            )
            value = json.loads(completed.stdout)
            self.assertEqual(value["services"]["evidence"]["baseUrl"], "http://127.0.0.1:14318")
            self.assertEqual(value["services"]["evolution"]["baseUrl"], "http://127.0.0.1:18000")
            self.assertEqual(value["observation"]["baseUrl"], value["services"]["evidence"]["baseUrl"])
            self.assertNotIn("credential", completed.stdout.lower())

    def test_preflight_rejects_non_loopback_override_and_port_conflict_before_docker(self) -> None:
        import socket

        with tempfile.TemporaryDirectory() as temporary:
            temporary_root = Path(temporary)
            bundle = self.build(temporary_root)
            fake_bin = temporary_root / "bin"
            fake_bin.mkdir()
            marker = temporary_root / "docker-called"
            docker = fake_bin / "docker"
            docker.write_text(
                "#!/bin/sh\ncase \"$*\" in *' pull'|*' up '*|*' restart '*) "
                "touch \"$WSR_TEST_DOCKER_MARKER\";; esac\nexit 0\n",
                encoding="utf-8",
            )
            docker.chmod(0o755)
            base_environment = os.environ | {
                "PATH": f"{fake_bin}:{os.environ['PATH']}",
                "WSR_TEST_DOCKER_MARKER": str(marker),
                "WSR_PREFLIGHT_PORT_WAIT_MS": "100",
            }
            remote = subprocess.run(
                [str(bundle / "wsr-compose"), "start"],
                env=base_environment | {"WSR_EVIDENCE_HOST": "0.0.0.0"},
                capture_output=True,
                text=True,
            )
            self.assertEqual(remote.returncode, 2)
            self.assertIn("LOOPBACK_HOST_REQUIRED", remote.stderr)
            self.assertFalse(marker.exists())

            with socket.socket() as listener:
                listener.bind(("127.0.0.1", 0))
                listener.listen()
                port = str(listener.getsockname()[1])
                conflict = subprocess.run(
                    [str(bundle / "wsr-compose"), "start"],
                    env=base_environment | {"WSR_EVIDENCE_PORT": port},
                    capture_output=True,
                    text=True,
                )
            self.assertEqual(conflict.returncode, 2)
            self.assertIn("LOOPBACK_PORT_IN_USE", conflict.stderr)
            self.assertFalse(marker.exists())

    def test_preflight_bounds_a_transient_restart_listener_window(self) -> None:
        import socket
        import threading
        import time

        with tempfile.TemporaryDirectory() as temporary:
            temporary_root = Path(temporary)
            bundle = self.build(temporary_root)
            fake_bin = temporary_root / "bin"
            fake_bin.mkdir()
            docker = fake_bin / "docker"
            docker.write_text("#!/bin/sh\nexit 0\n", encoding="utf-8")
            docker.chmod(0o755)
            listener = socket.socket()
            listener.bind(("127.0.0.1", 0))
            listener.listen()
            port = str(listener.getsockname()[1])

            def release() -> None:
                time.sleep(0.2)
                listener.close()

            closer = threading.Thread(target=release)
            closer.start()
            completed = subprocess.run(
                [str(bundle / "wsr-compose"), "start"],
                env=os.environ | {
                    "PATH": f"{fake_bin}:{os.environ['PATH']}",
                    "WSR_EVIDENCE_PORT": port,
                    "WSR_LOCAL_STATE_DIR": str(temporary_root / "state"),
                },
                capture_output=True,
                text=True,
            )
            closer.join()
            self.assertEqual(completed.returncode, 0, completed.stderr)

    def test_logs_without_service_does_not_pass_an_empty_service_name(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            temporary_root = Path(temporary)
            bundle = self.build(temporary_root)
            fake_bin = temporary_root / "bin"
            fake_bin.mkdir()
            docker = fake_bin / "docker"
            docker.write_text(
                "#!/bin/sh\nlast=x\nfor argument do last=$argument; done\n"
                "if test -z \"$last\"; then exit 31; fi\nexit 0\n",
                encoding="utf-8",
            )
            docker.chmod(0o755)
            completed = subprocess.run(
                [str(bundle / "wsr-compose"), "logs"],
                env=os.environ
                | {
                    "PATH": f"{fake_bin}:{os.environ['PATH']}",
                    "WSR_LOCAL_STATE_DIR": str(temporary_root / "state"),
                },
            )
            self.assertEqual(completed.returncode, 0)

    def test_launcher_rejects_missing_workflow_source_configuration_before_docker(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            temporary_root = Path(temporary)
            bundle = self.build(temporary_root)
            completed = subprocess.run(
                [str(bundle / "wsr-compose"), "start"],
                env=os.environ
                | {"WSR_EVOLUTION_CONFIG_FILE": str(temporary_root / "does-not-exist.json")},
                capture_output=True,
                text=True,
            )
            self.assertEqual(completed.returncode, 2)
            self.assertIn("WSR_EVOLUTION_CONFIG_FILE", completed.stderr)

    def test_release_workflow_builds_and_rechecks_the_versioned_bundle(self) -> None:
        workflow = (ROOT / ".github" / "workflows" / "release-compose-bundle.yml").read_text(
            encoding="utf-8"
        )

        self.assertIn("deployment/published/build-bundle.py", workflow)
        self.assertIn("deployment/published/validate-qualification.py", workflow)
        self.assertIn("docker buildx imagetools inspect", workflow)
        self.assertIn('index("amd64") != null and index("arm64") != null', workflow)
        self.assertIn("sha256sum --check SHA256SUMS", workflow)
        self.assertIn("docker compose -f compose.yaml config --quiet", workflow)
        self.assertIn("./wsr-compose host-config", workflow)
        self.assertIn("./wsr-compose preflight", workflow)
        self.assertIn("actions/upload-artifact@", workflow)
        self.assertIn("contents: write", workflow)
        self.assertIn('test "$VERSION" = "${VERSION%%-*}"', workflow)
        self.assertIn('wsr-services-$VERSION.tar.gz', workflow)
        self.assertIn('sha256sum "$(basename "$ARCHIVE")"', workflow)
        self.assertIn('gh release create "compose-$VERSION"', workflow)
        self.assertIn('--target "$(git rev-parse HEAD)"', workflow)
        self.assertIn("github.event_name == 'workflow_dispatch'", workflow)

    def test_stable_manifest_reuses_the_qualified_rc_image_digests(self) -> None:
        stable = json.loads(FINAL_MANIFEST.read_text(encoding="utf-8"))
        candidate = json.loads(
            (ROOT / "release" / "compose" / "0.1.0-rc.1.json").read_text(encoding="utf-8")
        )

        self.assertEqual(stable["version"], "0.1.1")
        self.assertEqual(candidate["version"], "0.1.0-rc.1")
        self.assertEqual(stable["images"], candidate["images"])
        self.assertEqual(stable["schemaCompatibility"], candidate["schemaCompatibility"])
        self.assertEqual(stable["hostIntegration"], candidate["hostIntegration"])

    def test_first_party_qualification_must_match_manifest_identity(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            value = manifest()
            evidence_commit = "b" * 40
            evolution_commit = "c" * 40
            value["images"]["evidence"]["source"] = (  # type: ignore[index]
                f"https://github.com/firestige/wsr-evidence/tree/{evidence_commit}"
            )
            value["images"]["evidence"]["provenance"] = (  # type: ignore[index]
                "https://github.com/firestige/wsr-evidence/releases/download/0.1.0/release-qualification.json"
            )
            value["images"]["evolution"]["source"] = (  # type: ignore[index]
                f"https://github.com/firestige/wsr-evolution/tree/{evolution_commit}"
            )
            value["images"]["evolution"]["provenance"] = (  # type: ignore[index]
                "https://github.com/firestige/wsr-evolution/releases/download/0.1.0/release-qualification.json"
            )
            evidence = root / "evidence.json"
            evidence.write_text(
                json.dumps(
                    {
                        "schemaVersion": "wsr.release-qualification@1.0.0",
                        "candidateTag": "0.1.0",
                        "commit": evidence_commit,
                        "ociDigest": f"sha256:{SHA}",
                        "localAcceptance": {"status": "PASS"},
                        "remoteQualification": {"status": "PASS"},
                    }
                ),
                encoding="utf-8",
            )
            evolution = root / "evolution.json"
            evolution.write_text(
                json.dumps(
                    {
                        "schemaVersion": "wsr.evolution-image-qualification@1.0.0",
                        "candidateTag": "0.1.0",
                        "commit": evolution_commit,
                        "ociDigest": f"sha256:{SHA}",
                        "platforms": ["linux/amd64", "linux/arm64"],
                        "provenance": {"mode": "max", "status": "PASS"},
                    }
                ),
                encoding="utf-8",
            )
            for name, path in (("evidence", evidence), ("evolution", evolution)):
                digest = hashlib.sha256(path.read_bytes()).hexdigest()
                value["images"][name]["qualificationSha256"] = f"sha256:{digest}"  # type: ignore[index]
            release = root / "release.json"
            release.write_text(json.dumps(value), encoding="utf-8")
            command = [
                str(PUBLISHED / "validate-qualification.py"),
                str(release),
                str(evidence),
                str(evolution),
            ]

            subprocess.run(command, check=True)
            original = evolution.read_text(encoding="utf-8")
            evolution.write_text(original + "\n", encoding="utf-8")
            self.assertNotEqual(subprocess.run(command).returncode, 0)
            evolution.write_text(original, encoding="utf-8")
            broken = json.loads(evolution.read_text(encoding="utf-8"))
            broken["ociDigest"] = f"sha256:{'d' * 64}"
            evolution.write_text(json.dumps(broken), encoding="utf-8")
            self.assertNotEqual(subprocess.run(command).returncode, 0)

    def test_published_image_e2e_covers_real_lifecycle_without_user_data(self) -> None:
        e2e = (ROOT / "deployment" / "test-published-e2e.sh").read_text(encoding="utf-8")

        self.assertIn("WSR_RUN_PUBLISHED_E2E", e2e)
        self.assertIn("release/compose/0.1.5.json", e2e)
        self.assertIn("build-bundle.py", e2e)
        self.assertIn('"$bundle/wsr-compose" start', e2e)
        self.assertIn('"$bundle/wsr-compose" restart', e2e)
        self.assertIn('"$bundle/wsr-compose" upgrade', e2e)
        self.assertIn('"$bundle/wsr-compose" rollback', e2e)
        self.assertIn("select version_num from alembic_version", e2e)
        self.assertIn("Published service stack did not become ready", e2e)
        self.assertIn('"$bundle/wsr-compose" purge', e2e)
        self.assertIn("wsr-published-e2e-", e2e)


if __name__ == "__main__":
    unittest.main()
