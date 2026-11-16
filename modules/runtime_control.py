"""Small cross-process runtime state store for the bot and local control UI."""

from __future__ import annotations

import json
import os
import tempfile
import threading
import time
from copy import deepcopy


ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATE_PATH = os.path.join(ROOT, ".bot_runtime.json")
_lock = threading.RLock()


def default_state(token: str = "") -> dict:
    return {
        "revision": 0,
        "token": token,
        "paused": False,
        "stop": False,
        "refresh": False,
        "status": "idle",
        "current_job": "",
        "progress": {"processed": 0, "applied": 0, "skipped": 0, "unresolved": 0},
        "last_error": "",
        "updated_at": time.time(),
        "settings": {
            "search_term": "",
            "location": "",
            "easy_apply_only": None,
            "timing_profile": "balanced",
            "use_ai": None,
        },
    }


def resolve_search_terms(configured_terms, settings) -> list[str]:
    """Use a transient single-term override only when the user explicitly set one."""
    settings = settings if isinstance(settings, dict) else {}
    override = str(settings.get("search_term") or "").strip()
    if override:
        return [override]
    return [str(term).strip() for term in (configured_terms or []) if str(term).strip()]


def read_state() -> dict:
    with _lock:
        try:
            with open(STATE_PATH, encoding="utf-8") as handle:
                state = json.load(handle)
            if isinstance(state, dict):
                return state
        except (OSError, ValueError, TypeError):
            pass
        return default_state()


def write_state(state: dict) -> dict:
    """Atomically replace the state file so bot/UI readers never see partial JSON."""
    state = deepcopy(state)
    state["revision"] = int(state.get("revision", 0)) + 1
    state["updated_at"] = time.time()
    with _lock:
        folder = os.path.dirname(STATE_PATH)
        fd, temp_path = tempfile.mkstemp(prefix=".bot_runtime.", suffix=".tmp", dir=folder)
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as handle:
                json.dump(state, handle, ensure_ascii=False)
                handle.flush()
                os.fsync(handle.fileno())
            os.replace(temp_path, STATE_PATH)
        finally:
            try:
                os.unlink(temp_path)
            except OSError:
                pass
    return state


def start_run(token: str) -> dict:
    state = default_state(token)
    state["status"] = "running"
    return write_state(state)


def update_state(**changes) -> dict:
    state = read_state()
    for key, value in changes.items():
        if key == "settings" and isinstance(value, dict):
            settings = dict(state.get("settings") or {})
            settings.update(value)
            state["settings"] = settings
        else:
            state[key] = value
    return write_state(state)


def clear_state() -> None:
    try:
        os.remove(STATE_PATH)
    except OSError:
        pass
