#!/usr/bin/env python3
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).parents[3]


def run(argv: list[str], cwd: Path, timeout: int = 180) -> None:
    print(f"+ ({cwd.relative_to(ROOT) or '.'}) {' '.join(argv)}", flush=True)
    subprocess.run(argv, cwd=cwd, check=True, timeout=timeout)


def main() -> None:
    run([sys.executable, "qualification/iter5/independence/check.py"], ROOT)
    run(
        [
            "pnpm",
            "exec",
            "vitest",
            "run",
            "test/coordinator/runner-adapter.test.ts",
            "test/delivery/delivery-lifecycle.test.ts",
            "test/observation/otlp-exporter.test.ts",
            "test/tooling/static-boundary-check.test.ts",
        ],
        ROOT / "execution-system",
    )
    run(
        [
            "uv",
            "run",
            "--python",
            "3.14",
            "pytest",
            "-q",
            "tests/unit/test_otlp_ingest.py",
            "tests/unit/test_architecture.py",
            "tests/unit/test_deployment_contract.py",
        ],
        ROOT / "evidence-system",
    )
    run(["./scripts/integration-test.sh"], ROOT / "evidence-system", timeout=240)
    run([sys.executable, "deployment/check-iter5-compose.py"], ROOT)
    print("Iteration 5 Wave10 independence qualification: PASS")


if __name__ == "__main__":
    main()
