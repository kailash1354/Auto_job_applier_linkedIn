"""Contract coverage for the shared floating control center and runtime APIs."""

import csv

import app
from modules import runtime_control
from modules.bot_control import control_center_asset


def _isolated_state(monkeypatch, tmp_path):
    monkeypatch.setattr(runtime_control, "STATE_PATH", str(tmp_path / "runtime.json"))
    runtime_control.clear_state()


def test_floating_asset_is_isolated_and_has_required_interactions():
    asset = control_center_asset()
    assert "attachShadow" in asset
    assert "width:40px" in asset and "height:40px" in asset
    assert "pointerdown" in asset and "pointermove" in asset
    assert "linkedinJobApplierControlPosition" in asset
    assert "/api/copilot" in asset and "/api/analytics" in asset


def test_runtime_mutation_requires_active_token(monkeypatch, tmp_path):
    _isolated_state(monkeypatch, tmp_path)
    runtime_control.start_run("expected-token")
    client = app.app.test_client()

    assert client.post("/api/runtime", json={"paused": True}).status_code == 403
    assert client.post("/api/runtime", headers={"X-Bot-Control-Token": "wrong"}, json={"paused": True}).status_code == 403
    response = client.post("/api/runtime", headers={"X-Bot-Control-Token": "expected-token"}, json={"paused": True})
    assert response.status_code == 200
    assert response.get_json()["paused"] is True
    assert "token" not in response.get_json()


def test_copilot_command_updates_shared_runtime(monkeypatch, tmp_path):
    _isolated_state(monkeypatch, tmp_path)
    runtime_control.start_run("copilot-token")
    client = app.app.test_client()

    response = client.post("/api/copilot", headers={"X-Bot-Control-Token": "copilot-token"}, json={"message": "pause"})
    assert response.status_code == 200
    assert response.get_json()["runtime"]["paused"] is True
    assert runtime_control.read_state()["paused"] is True


def test_analytics_uses_existing_history_csv(monkeypatch, tmp_path):
    monkeypatch.setattr(app, "PATH", str(tmp_path) + "/")
    with open(tmp_path / "all_applied_applications_history.csv", "w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["External Job link", "Date Applied"])
        writer.writeheader()
        writer.writerow({"External Job link": "Easy Applied", "Date Applied": "2026-01-01"})
        writer.writerow({"External Job link": "https://example.com", "Date Applied": "Pending"})

    response = app.app.test_client().get("/api/analytics")
    assert response.status_code == 200
    assert response.get_json()["total"] == 2
    assert response.get_json()["easy_applied"] == 1
    assert response.get_json()["pending"] == 1
