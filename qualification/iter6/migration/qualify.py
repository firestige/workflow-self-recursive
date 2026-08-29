#!/usr/bin/env python3
from __future__ import annotations

import subprocess
import sys
from collections import Counter
from pathlib import Path

from authority_migration import (
    load_manifest,
    scan_paths,
    tracked_paths,
    validate_authority_document_coverage,
    validate_manifest,
)


ROOT = Path(__file__).parents[3]
MANIFEST = ROOT / "migration/iter6/v1/authority-migration.json"
AUTHORITY_DOCUMENT = ROOT / "docs/reference/wsr-authority-mapping.md"


def main() -> None:
    subprocess.run(
        [
            sys.executable,
            "-m",
            "unittest",
            "discover",
            "-s",
            "qualification/iter6/migration",
            "-p",
            "test_*.py",
            "-v",
        ],
        cwd=ROOT,
        check=True,
    )
    manifest = load_manifest(MANIFEST)
    validate_manifest(manifest)
    validate_authority_document_coverage(manifest, AUTHORITY_DOCUMENT)
    findings = scan_paths(ROOT, tracked_paths(ROOT), manifest)
    counts = Counter(finding.classification for finding in findings)
    print(
        "Iter6 migration preparation qualification: PASS "
        f"(active={counts['active']}, historical={counts['historical']}, "
        f"rollback={counts['rollback']}, fixture={counts['fixture']})"
    )


if __name__ == "__main__":
    main()
