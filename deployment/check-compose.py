#!/usr/bin/env python3
from __future__ import annotations

import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).parents[1]
COMPOSE = ROOT / "deployment/compose.yaml"


def normalized() -> dict[str, object]:
    completed = subprocess.run(
        ["docker", "compose", "-f", str(COMPOSE), "config", "--format", "json"],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    value = json.loads(completed.stdout)
    assert isinstance(value, dict)
    return value


def main() -> None:
    configuration = normalized()
    services = configuration["services"]
    assert isinstance(services, dict)
    assert set(services) == {"database", "migrate", "evidence", "evolution", "bi-app"}

    for name in ("database", "migrate", "evidence", "evolution"):
        service = services[name]
        assert isinstance(service, dict)
        assert not service.get("ports"), f"{name} must not publish a host port"
    bi = services["bi-app"]
    assert isinstance(bi, dict)
    assert bi["ports"] == [
        {
            "mode": "ingress",
            "target": 80,
            "published": "8080",
            "protocol": "tcp",
            "host_ip": "127.0.0.1",
        }
    ]

    expected_networks = {
        "database": {"evidence-db"},
        "migrate": {"evidence-db"},
        "evidence": {"evidence-db", "app-tier"},
        "evolution": {"app-tier"},
        "bi-app": {"app-tier"},
    }
    for name, expected in expected_networks.items():
        service = services[name]
        assert isinstance(service, dict)
        assert set(service["networks"]) == expected

    for name in ("evolution", "bi-app"):
        service = services[name]
        assert isinstance(service, dict)
        environment = service.get("environment", {})
        assert isinstance(environment, dict)
        assert not any(
            key.startswith(("PG", "POSTGRES", "DATABASE", "WSR_EVIDENCE_DATABASE"))
            for key in environment
        )
        assert not service.get("secrets")

    networks = configuration["networks"]
    assert isinstance(networks, dict)
    assert set(networks) == {"evidence-db", "app-tier"}
    assert networks["evidence-db"]["internal"] is True


if __name__ == "__main__":
    main()
