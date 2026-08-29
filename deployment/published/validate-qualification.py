#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path
from typing import Any


COMMIT = re.compile(r"^[0-9a-f]{40}$")
IMAGE = re.compile(r"^(?P<name>[a-z0-9./_-]+):(?P<tag>[A-Za-z0-9._-]+)@(?P<digest>sha256:[0-9a-f]{64})$")


def fail(message: str) -> None:
    raise SystemExit(f"invalid image qualification: {message}")


def load(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        fail(f"{path} must contain a JSON object")
    return value


def validate(
    name: str, image: dict[str, Any], qualification: dict[str, Any], qualification_bytes: bytes
) -> None:
    match = IMAGE.fullmatch(str(image.get("coordinate", "")))
    if match is None:
        fail(f"{name} coordinate is not exact")
    tag = match.group("tag")
    commit = qualification.get("commit")
    if not isinstance(commit, str) or COMMIT.fullmatch(commit) is None:
        fail(f"{name} qualification commit is not exact")
    expected_source = f"https://github.com/firestige/{name}-system/tree/{commit}"
    expected_evidence = (
        f"https://github.com/firestige/{name}-system/releases/download/"
        f"{tag}/release-qualification.json"
    )
    expected_sha256 = image.get("qualificationSha256")
    actual_sha256 = f"sha256:{hashlib.sha256(qualification_bytes).hexdigest()}"
    checks = {
        "qualification SHA-256": expected_sha256 == actual_sha256,
        "candidate tag": qualification.get("candidateTag") == tag,
        "OCI digest": qualification.get("ociDigest") == match.group("digest"),
        "source commit": image.get("source") == expected_source,
        "qualification URL": image.get("provenance") == expected_evidence,
    }
    for label, passed in checks.items():
        if not passed:
            fail(f"{name} {label} does not match the release manifest")

    if name == "evidence":
        if qualification.get("schemaVersion") != "wsr.release-qualification@1.0.0":
            fail("Evidence qualification schema is unsupported")
        for gate in ("localAcceptance", "remoteQualification"):
            value = qualification.get(gate)
            if not isinstance(value, dict) or value.get("status") != "PASS":
                fail(f"Evidence {gate} did not pass")
    else:
        if qualification.get("schemaVersion") != "wsr.evolution-image-qualification@1.0.0":
            fail("Evolution qualification schema is unsupported")
        if qualification.get("platforms") != ["linux/amd64", "linux/arm64"]:
            fail("Evolution qualification platform matrix is incomplete")
        provenance = qualification.get("provenance")
        if not isinstance(provenance, dict) or provenance != {"mode": "max", "status": "PASS"}:
            fail("Evolution provenance did not pass in max mode")


def main() -> None:
    if len(sys.argv) != 4:
        raise SystemExit(
            "usage: validate-qualification.py RELEASE.json EVIDENCE-QUALIFICATION.json "
            "EVOLUTION-QUALIFICATION.json"
        )
    release = load(Path(sys.argv[1]))
    images = release.get("images")
    if not isinstance(images, dict):
        fail("release manifest images are missing")
    for name, path in (("evidence", sys.argv[2]), ("evolution", sys.argv[3])):
        image = images.get(name)
        if not isinstance(image, dict):
            fail(f"release manifest {name} image is missing")
        qualification_path = Path(path)
        validate(name, image, load(qualification_path), qualification_path.read_bytes())


if __name__ == "__main__":
    main()
