#!/usr/bin/env python3
from __future__ import annotations

import argparse
import fnmatch
import json
import os
import re
import subprocess
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable, Mapping, Sequence


COMMAND_PHASES = ("preflight", "mechanical_replacement", "postflight", "inverse")
COMMAND_EFFECTS = {"read-only", "local-worktree", "remote-gated"}
COORDINATE_CATEGORIES = (
    "repositories",
    "submodules",
    "npm",
    "images",
    "releases",
    "configuration",
)


class ManifestError(RuntimeError):
    pass


@dataclass(frozen=True)
class Finding:
    path: str
    line: int
    column: int
    coordinate_id: str
    value: str
    replacement: str
    classification: str
    allowlist_id: str | None


def load_manifest(path: Path) -> dict[str, object]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise ManifestError(f"cannot load migration manifest {path}: {error}") from error
    if not isinstance(value, dict):
        raise ManifestError("migration manifest root must be an object")
    return value


def _require_object_list(container: Mapping[str, object], key: str) -> list[dict[str, object]]:
    value = container.get(key)
    if not isinstance(value, list) or not all(isinstance(item, dict) for item in value):
        raise ManifestError(f"{key} must be a list of objects")
    return value


def _validate_commands(step: Mapping[str, object], step_id: str) -> None:
    for phase in COMMAND_PHASES:
        commands = step.get(phase)
        if not isinstance(commands, list) or not commands:
            raise ManifestError(f"migration step {step_id} requires non-empty {phase} commands")
        for command in commands:
            if not isinstance(command, dict):
                raise ManifestError(f"migration step {step_id} {phase} command must be an object")
            argv = command.get("argv")
            if not isinstance(argv, list) or not argv or not all(isinstance(arg, str) and arg for arg in argv):
                raise ManifestError(f"migration step {step_id} {phase} command requires exact argv")
            effect = command.get("effect")
            if effect not in COMMAND_EFFECTS:
                raise ManifestError(f"migration step {step_id} {phase} has invalid effect {effect!r}")
            if effect == "remote-gated" and command.get("requires_human_approval") is not True:
                raise ManifestError(f"remote command in {step_id}/{phase} requires human approval")


def validate_manifest(manifest: Mapping[str, object]) -> None:
    if manifest.get("schema_version") != "1.0.0":
        raise ManifestError("schema_version must be 1.0.0")
    if manifest.get("mode") != "preparation-only" or manifest.get("remote_effects") != "forbidden":
        raise ManifestError("Wave 9 manifest must remain preparation-only with remote effects forbidden")

    coordinates = manifest.get("coordinates")
    if not isinstance(coordinates, dict):
        raise ManifestError("coordinates must be an object")
    for category in COORDINATE_CATEGORIES:
        entries = _require_object_list(coordinates, category)
        ids = [entry.get("id") for entry in entries]
        if any(not isinstance(identifier, str) or not identifier for identifier in ids):
            raise ManifestError(f"every {category} coordinate requires an id")
        if len(ids) != len(set(ids)):
            raise ManifestError(f"duplicate {category} coordinate id")
        for entry in entries:
            if "current" not in entry or "target" not in entry or "owner" not in entry:
                raise ManifestError(f"{category}/{entry.get('id')} requires current, target, and owner")

    consumers = _require_object_list(manifest, "consumers")
    for consumer in consumers:
        required = {"id", "kind", "owner_repository", "paths", "coordinate_ids", "staged_target"}
        missing = required - set(consumer)
        if missing:
            raise ManifestError(f"consumer {consumer.get('id')} is missing {sorted(missing)}")

    publishers = _require_object_list(manifest, "publishers")
    for publisher in publishers:
        if not {"id", "channel", "current", "target", "cutover_owner"} <= set(publisher):
            raise ManifestError(f"publisher {publisher.get('id')} is incomplete")

    patterns = _require_object_list(manifest, "legacy_patterns")
    for pattern in patterns:
        if not all(isinstance(pattern.get(key), str) and pattern.get(key) for key in ("coordinate_id", "value", "replacement")):
            raise ManifestError("legacy patterns require coordinate_id, value, and replacement")

    allowlists = _require_object_list(manifest, "allowlists")
    for allowlist in allowlists:
        if allowlist.get("classification") not in {"historical", "rollback", "fixture"}:
            raise ManifestError(f"invalid allowlist classification in {allowlist.get('id')}")
        if not isinstance(allowlist.get("path_globs"), list) or not allowlist["path_globs"]:
            raise ManifestError(f"allowlist {allowlist.get('id')} needs path_globs")

    steps = _require_object_list(manifest, "migration_steps")
    for step in steps:
        step_id = step.get("id")
        if not isinstance(step_id, str) or not step_id:
            raise ManifestError("migration step requires an id")
        _validate_commands(step, step_id)

    validate_rollback_order(manifest)


def _authority_tokens(text: str) -> set[str]:
    tokens = set(re.findall(r"`([^`]+)`", text))
    selected: set[str] = set()
    for token in tokens:
        if "*" in token or "<" in token or token.startswith("#"):
            continue
        if (
            token.startswith("firestige/")
            or token.startswith("ghcr.io/firestige/")
            or token.startswith("https://api.github.com/repos/firestige/")
            or token.startswith("dsh-wsr")
            or token.startswith("wsr-")
            or token == "@wsr/bi@0.0.0"
            or token in {"/wsr", "/workflow-execution", "workflow_execution_intake"}
        ):
            selected.add(token)
    return selected


def validate_authority_document_coverage(manifest: Mapping[str, object], authority_document: Path) -> None:
    text = authority_document.read_text(encoding="utf-8")
    serialized = json.dumps(manifest, ensure_ascii=False, sort_keys=True)
    missing = sorted(token for token in _authority_tokens(text) if token not in serialized)
    if missing:
        raise ManifestError(f"manifest does not cover frozen authority coordinates: {missing}")


def validate_rollback_order(manifest: Mapping[str, object]) -> None:
    rollback_steps = _require_object_list(manifest, "rollback_steps")
    ids = [step.get("id") for step in rollback_steps]
    if len(ids) != len(set(ids)) or any(not isinstance(identifier, str) for identifier in ids):
        raise ManifestError("rollback step ids must be unique strings")
    position = {identifier: index for index, identifier in enumerate(ids)}
    for step in rollback_steps:
        dependencies = step.get("depends_on", [])
        if not isinstance(dependencies, list):
            raise ManifestError(f"rollback step {step.get('id')} depends_on must be a list")
        for dependency in dependencies:
            if dependency not in position:
                raise ManifestError(f"rollback step {step.get('id')} has unknown dependency {dependency}")
            if position[dependency] >= position[step["id"]]:
                raise ManifestError(f"rollback dependency {dependency} must precede {step['id']}")
    required_first = "rename-workflow-package-back"
    required_second = "restore-workflow-source-default"
    if required_first not in position or required_second not in position:
        raise ManifestError("rollback must include Workflow Package rename-back and source-default restore")
    if position[required_first] >= position[required_second]:
        raise ManifestError("Workflow Package rename-back must precede Workflow source default rollback")
    source_step = rollback_steps[position[required_second]]
    if required_first not in source_step.get("depends_on", []):
        raise ManifestError("Workflow source default rollback must depend on Workflow Package rename-back")


def _classification(path: str, coordinate_id: str, manifest: Mapping[str, object]) -> tuple[str, str | None]:
    allowlists = manifest.get("allowlists", [])
    if not isinstance(allowlists, list):
        return "active", None
    for classification in ("fixture", "rollback", "historical"):
        for allowlist in allowlists:
            if not isinstance(allowlist, dict) or allowlist.get("classification") != classification:
                continue
            coordinate_ids = allowlist.get("coordinate_ids", ["*"])
            if coordinate_ids != ["*"] and coordinate_id not in coordinate_ids:
                continue
            globs = allowlist.get("path_globs", [])
            if any(fnmatch.fnmatch(path, pattern) for pattern in globs):
                identifier = allowlist.get("id")
                return classification, identifier if isinstance(identifier, str) else None
    return "active", None


def _pattern_applies(path: str, pattern: Mapping[str, object]) -> bool:
    path_globs = pattern.get("path_globs", ["*"])
    return isinstance(path_globs, list) and any(
        isinstance(path_glob, str) and fnmatch.fnmatch(path, path_glob)
        for path_glob in path_globs
    )


def scan_paths(root: Path, paths: Iterable[Path], manifest: Mapping[str, object]) -> list[Finding]:
    patterns = manifest.get("legacy_patterns", [])
    if not isinstance(patterns, list):
        raise ManifestError("legacy_patterns must be a list")
    findings: list[Finding] = []
    for path in sorted(paths):
        try:
            relative = path.relative_to(root).as_posix()
            text = path.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError, ValueError):
            continue
        for line_number, line in enumerate(text.splitlines(), start=1):
            for pattern in patterns:
                if not isinstance(pattern, dict):
                    continue
                if not _pattern_applies(relative, pattern):
                    continue
                value = pattern.get("value")
                coordinate_id = pattern.get("coordinate_id")
                replacement = pattern.get("replacement")
                if not all(isinstance(item, str) for item in (value, coordinate_id, replacement)):
                    continue
                start = 0
                while True:
                    column = line.find(value, start)
                    if column < 0:
                        break
                    classification, allowlist_id = _classification(relative, coordinate_id, manifest)
                    findings.append(
                        Finding(
                            path=relative,
                            line=line_number,
                            column=column + 1,
                            coordinate_id=coordinate_id,
                            value=value,
                            replacement=replacement,
                            classification=classification,
                            allowlist_id=allowlist_id,
                        )
                    )
                    start = column + len(value)
    return findings


def rewrite_paths(
    root: Path,
    paths: Iterable[Path],
    manifest: Mapping[str, object],
    direction: str,
) -> list[str]:
    if direction not in {"forward", "reverse"}:
        raise ManifestError("rewrite direction must be forward or reverse")
    raw_patterns = manifest.get("legacy_patterns", [])
    if not isinstance(raw_patterns, list):
        raise ManifestError("legacy_patterns must be a list")
    replacements: list[tuple[str, str, str, Mapping[str, object]]] = []
    for pattern in raw_patterns:
        if not isinstance(pattern, dict):
            continue
        if pattern.get("rewrite", True) is False:
            continue
        coordinate_id = pattern.get("coordinate_id")
        current = pattern.get("value")
        target = pattern.get("replacement")
        if not all(isinstance(value, str) and value for value in (coordinate_id, current, target)):
            continue
        source, destination = (current, target) if direction == "forward" else (target, current)
        replacements.append((coordinate_id, source, destination, pattern))
    replacements.sort(key=lambda item: len(item[1]), reverse=True)

    changed: list[str] = []
    for path in sorted(paths):
        try:
            relative = path.relative_to(root).as_posix()
            original = path.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError, ValueError):
            continue
        rewritten = original
        for coordinate_id, source, destination, pattern in replacements:
            if not _pattern_applies(relative, pattern):
                continue
            classification, _ = _classification(relative, coordinate_id, manifest)
            if classification != "active":
                continue
            rewritten = rewritten.replace(source, destination)
        if rewritten == original:
            continue
        temporary = path.with_name(f".{path.name}.wsr-migration-{os.getpid()}.tmp")
        temporary.write_text(rewritten, encoding="utf-8")
        os.chmod(temporary, path.stat().st_mode)
        os.replace(temporary, path)
        changed.append(relative)
    return changed


def rewrite_repository(root: Path, manifest: Mapping[str, object], direction: str) -> list[str]:
    paths = tracked_paths(root)
    changed = rewrite_paths(root, paths, manifest, direction)
    staged = root / "migration/iter6/v1/staged"
    source = staged / (".gitmodules" if direction == "forward" else ".gitmodules.before")
    target = root / ".gitmodules"
    if source.is_file() and target.is_file():
        original = target.read_text(encoding="utf-8")
        replacement = source.read_text(encoding="utf-8")
        if original != replacement:
            target.write_text(replacement, encoding="utf-8")
            if ".gitmodules" not in changed:
                changed.append(".gitmodules")
    return sorted(changed)


def tracked_paths(root: Path) -> list[Path]:
    result = subprocess.run(
        ["git", "-C", str(root), "ls-files", "-z"],
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return [root / item.decode("utf-8") for item in result.stdout.split(b"\0") if item]


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Validate and scan the Iteration 6 authority migration")
    parser.add_argument("command", choices=("validate", "scan", "rewrite"))
    parser.add_argument("--root", type=Path, default=Path(__file__).parents[3])
    parser.add_argument("--manifest", type=Path)
    parser.add_argument("--authority-document", type=Path)
    parser.add_argument("--enforce-target", action="store_true")
    parser.add_argument("--direction", choices=("forward", "reverse"))
    args = parser.parse_args(argv)

    root = args.root.resolve()
    manifest_path = args.manifest or root / "migration/iter6/v1/authority-migration.json"
    authority_document = args.authority_document or root / "docs/reference/wsr-authority-mapping.md"
    manifest = load_manifest(manifest_path)
    validate_manifest(manifest)
    validate_authority_document_coverage(manifest, authority_document)

    if args.command == "validate":
        print("Iter6 authority migration manifest: PASS")
        return 0

    if args.command == "rewrite":
        if args.direction is None:
            parser.error("rewrite requires --direction")
        changed = rewrite_repository(root, manifest, args.direction)
        print(json.dumps({"direction": args.direction, "changed": changed}, indent=2))
        return 0

    findings = scan_paths(root, tracked_paths(root), manifest)
    print(json.dumps([asdict(finding) for finding in findings], ensure_ascii=False, indent=2))
    active = [finding for finding in findings if finding.classification == "active"]
    if args.enforce_target and active:
        print(f"active old-coordinate findings: {len(active)}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
