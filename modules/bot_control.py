'''Bridge the reusable floating control-center asset into the Selenium page.'''

from __future__ import annotations

import json
import os
from functools import lru_cache
from pathlib import Path

from modules import runtime_control
from modules.helpers import logger


ROOT = Path(__file__).resolve().parents[1]
ASSET = ROOT / "static" / "floating_control.js"


@lru_cache(maxsize=1)
def control_center_asset() -> str:
    """Return the versioned browser asset without keeping UI source in Python."""
    return ASSET.read_text(encoding="utf-8")


def install_control_menu(driver) -> None:
    """Install a fresh isolated control center after each LinkedIn navigation."""
    config = {
        "token": os.environ.get("BOT_CONTROL_TOKEN", ""),
        "baseUrl": os.environ.get("BOT_CONTROL_URL", "http://127.0.0.1:5001"),
    }
    script = "window.__LINKEDIN_BOT_CONTROL_CONFIG__ = " + json.dumps(config) + ";\n" + control_center_asset()
    try:
        driver.execute_script(script)
        publish_status(last_error="")
    except Exception as error:
        message = f"Could not install floating control center: {type(error).__name__}"
        publish_status(last_error=message)
        logger.warning(message, exc_info=True)


def read_control_state(driver) -> dict:
    """Prefer the atomic server state; page state is never authoritative."""
    return runtime_control.read_state()


def reset_refresh_flag(driver) -> None:
    if runtime_control.read_state().get("refresh"):
        runtime_control.update_state(refresh=False)


def publish_status(**changes) -> dict:
    return runtime_control.update_state(**changes)
