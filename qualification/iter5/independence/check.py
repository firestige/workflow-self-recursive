#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).parents[3]
EXECUTION = ROOT / "execution-system"

FORBIDDEN_SOURCE = (
    "/v1/evidence/",
    "/api/evolution/",
    "ResolvedEvaluationContext",
    "wsr_evidence",
    "wsr_evolution",
)
FORBIDDEN_DEPENDENCIES = {
    "pg",
    "postgres",
    "postgresql",
    "psycopg",
    "wsr-evidence",
    "wsr-evolution",
    "wsr-ui",
}
OBSERVE_ANCHOR = "void Promise.resolve(this.#options.observation.observe"
RESULT_ANCHOR = "record.result = deepFreeze"


class BoundaryViolation(RuntimeError):
    pass


def source_texts(execution: Path) -> dict[str, str]:
    return {
        str(path.relative_to(execution)): path.read_text(encoding="utf-8")
        for path in sorted((execution / "src").rglob("*.ts"))
    }


def check_sources(texts: dict[str, str]) -> None:
    for name, source in texts.items():
        for forbidden in FORBIDDEN_SOURCE:
            if forbidden in source:
                raise BoundaryViolation(f"{name} contains forbidden downstream reference {forbidden}")
    coordinator = texts["src/coordinator/runner-coordinator.ts"]
    result_position = coordinator.find(RESULT_ANCHOR)
    observe_position = coordinator.find(OBSERVE_ANCHOR)
    if result_position < 0 or observe_position < 0 or result_position >= observe_position:
        raise BoundaryViolation("terminal truth must be saved before fire-and-forget Observation")


def check_dependencies(execution: Path) -> None:
    package = json.loads((execution / "package.json").read_text(encoding="utf-8"))
    declared = set(package.get("dependencies", {})) | set(package.get("optionalDependencies", {}))
    found = sorted(declared & FORBIDDEN_DEPENDENCIES)
    if found:
        raise BoundaryViolation(f"Execution declares downstream/database dependencies: {found}")


def assert_canonical_equal(baseline: object, candidate: object) -> None:
    if baseline != candidate:
        raise BoundaryViolation("downstream disposition changed canonical Execution truth")


def check_mutant_sensitivity(texts: dict[str, str]) -> None:
    route_mutant = dict(texts)
    route_mutant["src/mutant.ts"] = 'fetch("/api/evolution/v1/evaluations:compute")'
    try:
        check_sources(route_mutant)
    except BoundaryViolation:
        pass
    else:
        raise BoundaryViolation("route-coupling mutant escaped the scanner")

    await_mutant = dict(texts)
    coordinator = await_mutant["src/coordinator/runner-coordinator.ts"]
    await_mutant["src/coordinator/runner-coordinator.ts"] = coordinator.replace(
        OBSERVE_ANCHOR, "await Promise.resolve(this.#options.observation.observe", 1
    )
    try:
        check_sources(await_mutant)
    except BoundaryViolation:
        pass
    else:
        raise BoundaryViolation("awaited-downstream mutant escaped the scanner")

    baseline = {"outcome": "COMPLETED", "result": {"answer": 42}}
    coupled = {"outcome": "FAILED", "result": {"answer": 42}}
    try:
        assert_canonical_equal(baseline, coupled)
    except BoundaryViolation:
        pass
    else:
        raise BoundaryViolation("canonical-result mutant escaped the comparator")


def main() -> None:
    texts = source_texts(EXECUTION)
    check_dependencies(EXECUTION)
    check_sources(texts)
    check_mutant_sensitivity(texts)
    print("Iter5 independence static and mutant checks: PASS")


if __name__ == "__main__":
    main()
