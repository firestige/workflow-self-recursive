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
FINAL_MANIFEST = ROOT / "release" / "compose" / "0.1.0-rc.1.json"

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
            self.assertIn("${WSR_EVOLUTION_CONFIG_FILE:-./evolution.config.json}", compose)

    def test_final_release_manifest_binds_the_qualified_image_set(self) -> None:
        release = json.loads(FINAL_MANIFEST.read_text(encoding="utf-8"))

        self.assertEqual(release["version"], "0.1.0-rc.1")
        self.assertEqual(
            release["images"]["postgres"]["coordinate"],
            "postgres:18.4-bookworm@sha256:882236b897e39051d2368c5ccc6cda944904723506b2dfc97f2a8f5bc9afa382",
        )
        self.assertEqual(
            release["images"]["evidence"]["coordinate"],
            "ghcr.io/firestige/wsr-evidence:0.1.0-rc.2@sha256:ad9f66b9203850d4111ac627f66de5a9bbf2037537f7fd6265b2f5f410f711c4",
        )
        self.assertEqual(
            release["images"]["evolution"]["coordinate"],
            "ghcr.io/firestige/wsr-evolution:0.1.0-rc.1@sha256:41e244d68f588d8b0a4789488a694c55e2034e36f4a152638e026c03dde1a14f",
        )
        self.assertEqual(release["schemaCompatibility"]["evidenceRevision"], "20260826_0003")
        self.assertEqual(
            release["images"]["evidence"]["provenance"],
            "https://github.com/firestige/evidence-system/releases/download/0.1.0-rc.2/release-qualification.json",
        )
        self.assertEqual(
            release["images"]["evolution"]["provenance"],
            "https://github.com/firestige/evolution-system/releases/download/0.1.0-rc.1/release-qualification.json",
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
        start_stack = launcher.split("start_stack() {", 1)[1].split("}", 1)[0]
        self.assertLess(start_stack.index("compose pull"), start_stack.index("wait_stack"))
        self.assertIn("start | upgrade | rollback) start_stack", launcher)
        self.assertNotIn("down --volumes", launcher)

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
        self.assertIn("actions/upload-artifact@", workflow)

    def test_first_party_qualification_must_match_manifest_identity(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            value = manifest()
            evidence_commit = "b" * 40
            evolution_commit = "c" * 40
            value["images"]["evidence"]["source"] = (  # type: ignore[index]
                f"https://github.com/firestige/evidence-system/tree/{evidence_commit}"
            )
            value["images"]["evidence"]["provenance"] = (  # type: ignore[index]
                "https://github.com/firestige/evidence-system/releases/download/0.1.0/release-qualification.json"
            )
            value["images"]["evolution"]["source"] = (  # type: ignore[index]
                f"https://github.com/firestige/evolution-system/tree/{evolution_commit}"
            )
            value["images"]["evolution"]["provenance"] = (  # type: ignore[index]
                "https://github.com/firestige/evolution-system/releases/download/0.1.0/release-qualification.json"
            )
            release = root / "release.json"
            release.write_text(json.dumps(value), encoding="utf-8")
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
            command = [
                str(PUBLISHED / "validate-qualification.py"),
                str(release),
                str(evidence),
                str(evolution),
            ]

            subprocess.run(command, check=True)
            broken = json.loads(evolution.read_text(encoding="utf-8"))
            broken["ociDigest"] = f"sha256:{'d' * 64}"
            evolution.write_text(json.dumps(broken), encoding="utf-8")
            self.assertNotEqual(subprocess.run(command).returncode, 0)

    def test_published_image_e2e_covers_real_lifecycle_without_user_data(self) -> None:
        e2e = (ROOT / "deployment" / "test-published-e2e.sh").read_text(encoding="utf-8")

        self.assertIn("WSR_RUN_PUBLISHED_E2E", e2e)
        self.assertIn("release/compose/0.1.0-rc.1.json", e2e)
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
