from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from authority_migration import (
    ManifestError,
    load_manifest,
    scan_paths,
    rewrite_paths,
    validate_authority_document_coverage,
    validate_manifest,
    validate_rollback_order,
)


ROOT = Path(__file__).parents[3]
MANIFEST = ROOT / "migration/iter6/v1/authority-migration.json"
AUTHORITY_DOCUMENT = ROOT / "docs/reference/wsr-authority-mapping.md"
STAGED_GITMODULES = ROOT / "migration/iter6/v1/staged/.gitmodules"


class AuthorityMigrationManifestTest(unittest.TestCase):
    def setUp(self) -> None:
        self.manifest = load_manifest(MANIFEST)

    def test_manifest_is_versioned_complete_and_matches_the_frozen_authority_document(self) -> None:
        validate_manifest(self.manifest)
        validate_authority_document_coverage(self.manifest, AUTHORITY_DOCUMENT)

        self.assertEqual(self.manifest["schema_version"], "1.0.0")
        self.assertEqual(self.manifest["mode"], "preparation-only")
        self.assertEqual(self.manifest["remote_effects"], "forbidden")

        expected_ids = {
            "repositories": {
                "product",
                "execution",
                "evidence",
                "evolution",
                "contracts",
                "workflow-package",
                "dsh",
                "standalone-ui",
            },
            "submodules": {
                "execution",
                "evidence",
                "evolution",
                "contracts",
                "workflow-package",
                "dsh",
                "standalone-ui",
            },
            "npm": {
                "execution-runtime",
                "dsh-execution",
                "dsh-studio",
                "dsh-suite",
                "evidence-placeholder",
                "evolution-placeholder",
            },
            "images": {"evidence", "evolution"},
            "releases": {
                "execution-core",
                "dsh-bundles",
                "evidence",
                "evolution",
                "contracts",
                "workflow-packages",
            },
            "configuration": {
                "workflow-source-repository",
                "workflow-source-api",
                "workflow-source-assets",
                "execution-schema",
                "dsh-command",
                "dsh-plugin-id",
                "dsh-skill",
                "dsh-tool",
                "telemetry-service",
                "dsh-execution-display",
                "dsh-studio-display",
                "dsh-suite-display",
            },
        }
        for category, ids in expected_ids.items():
            actual = {entry["id"] for entry in self.manifest["coordinates"][category]}
            self.assertTrue(ids <= actual, f"missing {category}: {sorted(ids - actual)}")

        self.assertTrue(self.manifest["consumers"])
        self.assertTrue(self.manifest["publishers"])
        self.assertEqual(
            self.manifest["deferred_coordinates"],
            [
                {
                    "id": "compose-final-image-family",
                    "owner_issue": 116,
                    "reason": "Final service and image inventory is owned by #116.",
                }
            ],
        )

    def test_every_migration_step_has_exact_checks_and_an_inverse(self) -> None:
        for step in self.manifest["migration_steps"]:
            self.assertTrue(step["preflight"], step["id"])
            self.assertTrue(step["mechanical_replacement"], step["id"])
            self.assertTrue(step["postflight"], step["id"])
            self.assertTrue(step["inverse"], step["id"])
            for phase in ("preflight", "mechanical_replacement", "postflight", "inverse"):
                for command in step[phase]:
                    self.assertIsInstance(command["argv"], list)
                    self.assertTrue(command["argv"])
                    self.assertIn(command["effect"], {"read-only", "local-worktree", "remote-gated"})
                    if command["effect"] == "remote-gated":
                        self.assertTrue(command["requires_human_approval"])

    def test_staged_gitmodules_keeps_paths_changes_urls_adds_dsh_and_retires_ui(self) -> None:
        staged = STAGED_GITMODULES.read_text(encoding="utf-8")
        for path in (
            "execution-system",
            "evidence-system",
            "evolution-system",
            "system-contracts",
            "workflow-package",
            "wsr-dsh",
        ):
            self.assertIn(f"path = {path}", staged)
        for repository in (
            "wsr-execution",
            "wsr-evidence",
            "wsr-evolution",
            "wsr-contracts",
            "wsr-workflow-package",
            "wsr-dsh",
        ):
            self.assertIn(f"https://github.com/firestige/{repository}.git", staged)
        self.assertNotIn("path = wsr-ui", staged)
        self.assertNotIn("/execution-system.git", staged)

    def test_workflow_source_rollback_follows_repository_rename_back(self) -> None:
        validate_rollback_order(self.manifest)
        rollback = [step["id"] for step in self.manifest["rollback_steps"]]
        self.assertLess(
            rollback.index("rename-workflow-package-back"),
            rollback.index("restore-workflow-source-default"),
        )


class OldCoordinateScannerTest(unittest.TestCase):
    def setUp(self) -> None:
        self.manifest = load_manifest(MANIFEST)

    def test_scanner_classifies_active_historical_rollback_and_fixture_references(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            files = {
                "README.md": "https://github.com/firestige/execution-system\n",
                "release/publications/stable.json": '{"repository":"firestige/execution-system"}\n',
                "docs/reference/wsr-authority-mapping.md": "`firestige/execution-system`\n",
                "qualification/iter6/migration/fixtures/old.txt": "firestige/execution-system\n",
            }
            for relative, content in files.items():
                path = root / relative
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(content, encoding="utf-8")

            findings = scan_paths(root, [root / relative for relative in files], self.manifest)
            classifications = {finding.path: finding.classification for finding in findings}

            self.assertEqual(classifications["README.md"], "active")
            self.assertEqual(classifications["release/publications/stable.json"], "historical")
            self.assertEqual(classifications["docs/reference/wsr-authority-mapping.md"], "rollback")
            self.assertEqual(
                classifications["qualification/iter6/migration/fixtures/old.txt"],
                "fixture",
            )

    def test_scanner_treats_manifest_commands_as_data_and_never_executes_them(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            marker = root / "must-not-exist"
            source = root / "README.md"
            source.write_text("firestige/execution-system\n", encoding="utf-8")
            poisoned = json.loads(json.dumps(self.manifest))
            poisoned["migration_steps"][0]["mechanical_replacement"].append(
                {
                    "argv": ["touch", str(marker)],
                    "effect": "remote-gated",
                    "requires_human_approval": True,
                }
            )

            findings = scan_paths(root, [source], poisoned)

            self.assertEqual(len(findings), 1)
            self.assertFalse(marker.exists())

    def test_scanner_honors_coordinate_specific_path_globs(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            workflow = root / ".github/workflows/release.yml"
            readme = root / "README.md"
            workflow.parent.mkdir(parents=True)
            workflow.write_text("repositories: execution-system\n", encoding="utf-8")
            readme.write_text("repositories: execution-system\n", encoding="utf-8")
            scoped = json.loads(json.dumps(self.manifest))
            scoped["legacy_patterns"] = [
                {
                    "coordinate_id": "publishers/github-app-wsr-release",
                    "value": "repositories: execution-system",
                    "replacement": "repositories: wsr-execution",
                    "path_globs": [".github/workflows/**"],
                }
            ]

            findings = scan_paths(root, [workflow, readme], scoped)

            self.assertEqual([finding.path for finding in findings], [".github/workflows/release.yml"])

    def test_report_only_coordinate_is_scanned_but_not_mechanically_rewritten(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / ".gitmodules"
            source.write_text("url = https://github.com/firestige/wsr-ui.git\n", encoding="utf-8")
            report_only = json.loads(json.dumps(self.manifest))
            report_only["legacy_patterns"] = [
                {
                    "coordinate_id": "repositories/standalone-ui",
                    "value": "firestige/wsr-ui",
                    "replacement": "approved-wave13-retirement",
                    "rewrite": False,
                }
            ]

            findings = scan_paths(root, [source], report_only)
            changed = rewrite_paths(root, [source], report_only, direction="forward")

            self.assertEqual(len(findings), 1)
            self.assertEqual(changed, [])
            self.assertIn("firestige/wsr-ui", source.read_text(encoding="utf-8"))

    def test_validator_rejects_a_remote_command_without_an_approval_gate(self) -> None:
        invalid = json.loads(json.dumps(self.manifest))
        invalid["migration_steps"][0]["mechanical_replacement"][0] = {
            "argv": ["gh", "repo", "rename", "wsr"],
            "effect": "remote-gated",
            "requires_human_approval": False,
        }

        with self.assertRaisesRegex(ManifestError, "human approval"):
            validate_manifest(invalid)

    def test_mechanical_rewriter_is_reversible_and_preserves_allowlisted_history(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            active = root / "README.md"
            historical = root / "release/publications/stable.json"
            active.write_text(
                "https://github.com/firestige/execution-system and wsr-dsh-intake\n",
                encoding="utf-8",
            )
            historical.parent.mkdir(parents=True)
            historical.write_text('{"repository":"firestige/execution-system"}\n', encoding="utf-8")
            original_active = active.read_text(encoding="utf-8")

            changed = rewrite_paths(root, [active, historical], self.manifest, direction="forward")

            self.assertEqual(changed, ["README.md"])
            self.assertEqual(
                active.read_text(encoding="utf-8"),
                "https://github.com/firestige/wsr-execution and dsh-wsr-execution\n",
            )
            self.assertIn("firestige/execution-system", historical.read_text(encoding="utf-8"))

            reverse_changed = rewrite_paths(root, [active, historical], self.manifest, direction="reverse")

            self.assertEqual(reverse_changed, ["README.md"])
            self.assertEqual(active.read_text(encoding="utf-8"), original_active)


if __name__ == "__main__":
    unittest.main()
