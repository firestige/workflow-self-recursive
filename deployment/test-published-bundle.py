#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).parents[1]
PUBLISHED = ROOT / "deployment" / "published"
GENERATOR = PUBLISHED / "build-bundle.py"

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
        "images": {
            "postgres": {
                "coordinate": f"postgres:18.4-bookworm@sha256:{SHA}",
                "source": "https://github.com/docker-library/postgres",
                "provenance": "https://hub.docker.com/_/postgres",
            },
            "evidence": {
                "coordinate": f"ghcr.io/firestige/wsr-evidence:0.1.0@sha256:{SHA}",
                "source": "https://github.com/firestige/evidence-system",
                "provenance": "https://github.com/firestige/evidence-system/attestations",
            },
            "evolution": {
                "coordinate": f"ghcr.io/firestige/wsr-evolution:0.1.0@sha256:{SHA}",
                "source": "https://github.com/firestige/evolution-system",
                "provenance": "https://github.com/firestige/evolution-system/attestations",
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

    def test_generator_rejects_tags_without_digest_and_incompatible_schema(self) -> None:
        for mutate in ("tag", "schema"):
            with self.subTest(mutate=mutate), tempfile.TemporaryDirectory() as temporary:
                value = manifest()
                if mutate == "tag":
                    value["images"]["evolution"]["coordinate"] = (  # type: ignore[index]
                        "ghcr.io/firestige/wsr-evolution:0.1.0"
                    )
                else:
                    value["schemaCompatibility"]["reads"] = ["other"]  # type: ignore[index]
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
            subprocess.run([str(bundle / "wsr-compose"), "restart"], env=environment, check=True)
            self.assertEqual((state / "secrets" / "admin-password").read_bytes(), password)
            subprocess.run([str(bundle / "wsr-compose"), "stop"], env=environment, check=True)
            subprocess.run([str(bundle / "wsr-compose"), "upgrade"], env=environment, check=True)
            subprocess.run([str(bundle / "wsr-compose"), "rollback"], env=environment, check=True)
            self.assertEqual((state / "secrets" / "admin-password").read_bytes(), password)
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
            self.assertIn("compose.yaml restart database evidence evolution", commands)
            self.assertIn("compose.yaml stop", commands)
            self.assertIn("volume rm wsr-evidence-data", commands)

    def test_partial_start_failure_prints_status_and_logs(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            temporary_root = Path(temporary)
            bundle = self.build(temporary_root)
            fake_bin = temporary_root / "bin"
            fake_bin.mkdir()
            docker = fake_bin / "docker"
            docker.write_text(
                "#!/bin/sh\ncase \"$*\" in *'up --wait'*) exit 19;; esac\nexit 0\n",
                encoding="utf-8",
            )
            docker.chmod(0o755)
            completed = subprocess.run(
                [str(bundle / "wsr-compose"), "start"],
                env=os.environ
                | {
                    "PATH": f"{fake_bin}:{os.environ['PATH']}",
                    "WSR_LOCAL_STATE_DIR": str(temporary_root / "state"),
                },
                capture_output=True,
                text=True,
            )
            self.assertEqual(completed.returncode, 19)
            self.assertIn("Published service stack did not become ready", completed.stderr)

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

    def test_release_workflow_builds_and_rechecks_the_versioned_bundle(self) -> None:
        workflow = (ROOT / ".github" / "workflows" / "release-compose-bundle.yml").read_text(
            encoding="utf-8"
        )

        self.assertIn("deployment/published/build-bundle.py", workflow)
        self.assertIn("sha256sum --check SHA256SUMS", workflow)
        self.assertIn("docker compose -f compose.yaml config --quiet", workflow)
        self.assertIn("actions/upload-artifact@", workflow)


if __name__ == "__main__":
    unittest.main()
