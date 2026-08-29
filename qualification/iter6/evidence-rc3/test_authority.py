import hashlib
import json
import subprocess
import unittest
from pathlib import Path


ROOT = Path(__file__).parents[3]
AUTHORITY = ROOT / "release" / "candidates" / "iter6-wave10-evidence-rc3.json"


def digest(path: Path) -> str:
    return "sha256:" + hashlib.sha256(path.read_bytes()).hexdigest()


def head(path: Path) -> str:
    return subprocess.run(
        ["git", "rev-parse", "HEAD"], cwd=path, check=True, capture_output=True, text=True
    ).stdout.strip()


class EvidenceRc3AuthorityTest(unittest.TestCase):
    def test_authority_preserves_execution_and_binds_exact_evidence_candidate(self) -> None:
        value = json.loads(AUTHORITY.read_text(encoding="utf-8"))
        wave8 = json.loads(
            (ROOT / "release" / "candidates" / "iter6-wave8.json").read_text(encoding="utf-8")
        )

        self.assertEqual(value["execution"], wave8["execution"])
        self.assertEqual(
            head(ROOT / "execution-system"), "71a1bf4bb1d1562556081fad5c10b32f1ed7d8d4"
        )
        self.assertEqual(
            head(ROOT / "evidence-system"), "f09a1f04175140659726c6583a23928f03769a60"
        )
        evidence = value["evidence"]
        self.assertEqual(
            evidence["candidate_archive_commit"],
            "35d63469650e978d0fb795419df5d4a0ea5eafa7",
        )
        self.assertEqual(evidence["candidate_tag"], "0.1.0-rc.3")
        self.assertEqual(evidence["migration_revision"], "20260828_0004")
        component = ROOT / evidence["manifest_path"]
        self.assertEqual(evidence["manifest_sha256"], digest(component))
        self.assertEqual(
            [asset["sha256"] for asset in evidence["assets"]],
            [
                "sha256:1cc5587fea69ba5efb4b77e3824878b3ce2caa9780c1a9c1ff8e37fe01f2408f",
                "sha256:b2e1458dd511403d002b303e57de155bd4cd84dcbba9467db020c04aa29490e8",
            ],
        )

    def test_frozen_contract_authority_is_unchanged(self) -> None:
        value = json.loads(AUTHORITY.read_text(encoding="utf-8"))
        contract = value["contract_candidate"]
        record = ROOT / "system-contracts/evidence-query/publication/publication-record-0.1.0.json"

        self.assertEqual(contract["coordinate"], "evidence.query@0.1.0")
        self.assertEqual(contract["status"], "FROZEN")
        self.assertEqual(contract["conformance_claim"], "VALIDATOR_ONLY")
        self.assertEqual(contract["publication_record_sha256"], digest(record))


if __name__ == "__main__":
    unittest.main()
