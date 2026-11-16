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


def test_search_terms_keep_all_configured_roles_without_runtime_override():
    configured = ["Software Engineer", "Python Developer", "Data Scientist"]
    assert runtime_control.resolve_search_terms(configured, {"search_term": ""}) == configured


def test_explicit_runtime_search_term_overrides_configured_roles():
    configured = ["Software Engineer", "Python Developer"]
    assert runtime_control.resolve_search_terms(configured, {"search_term": "Notetaker"}) == ["Notetaker"]


def test_runtime_search_terms_override_configured_role_list():
    configured = ["Software Engineer", "Python Developer"]
    settings = {"search_terms": ["Full Stack Developer", "React Developer"]}
    assert runtime_control.resolve_search_terms(configured, settings) == settings["search_terms"]


def test_runtime_api_accepts_live_salary_controls(monkeypatch, tmp_path):
    _isolated_state(monkeypatch, tmp_path)
    runtime_control.start_run("salary-token")
    client = app.app.test_client()

    response = client.post(
        "/api/runtime",
        headers={"X-Bot-Control-Token": "salary-token"},
        json={"settings": {
            "search_terms": ["Full Stack Developer"],
            "salary": "$60,000+",
            "desired_salary": 500000,
        }},
    )

    assert response.status_code == 200
    settings = response.get_json()["settings"]
    assert settings["search_terms"] == ["Full Stack Developer"]
    assert settings["salary"] == "$60,000+"
    assert settings["desired_salary"] == 500000


def test_config_save_projects_role_and_salary_to_live_runtime(monkeypatch, tmp_path):
    _isolated_state(monkeypatch, tmp_path)
    runtime_control.start_run("config-token")
    monkeypatch.setattr(app, "USER_CONFIG_PATH", str(tmp_path / "user_config.json"))
    client = app.app.test_client()

    response = client.post("/api/config", json={
        "search": {"search_terms": ["Full Stack Developer"], "salary": "$60,000+"},
        "questions": {"desired_salary": 500000},
    })

    assert response.status_code == 200
    settings = runtime_control.read_state()["settings"]
    assert settings["search_terms"] == ["Full Stack Developer"]
    assert settings["salary"] == "$60,000+"
    assert settings["desired_salary"] == 500000
