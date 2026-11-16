'''
Author:     Sai Vignesh Golla
LinkedIn:   https://www.linkedin.com/in/saivigneshgolla/

Copyright (c) 2024-2026 Sai Vignesh Golla

License:    MIT License
            https://opensource.org/license/mit

GitHub:     https://github.com/GodsScion/Auto_job_applier_linkedIn

Support me: https://github.com/sponsors/GodsScion

version:    26.01.20.5.08
'''

from modules.helpers import get_default_temp_profile, make_directories
from config.settings import run_in_background, disable_extensions, safe_mode, file_name, failed_file_name, logs_folder_path, generated_resume_path
from config.questions import default_resume_path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import json, os, shutil, subprocess, sys
import undetected_chromedriver as uc
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait
from modules.helpers import find_default_profile_directory, critical_error_log, logger, print_lg
from selenium.common.exceptions import SessionNotCreatedException


AUTOMATION_PROFILE_ROOT = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "chrome_profile",
)


def _adhoc_sign(path: str) -> None:
    """Re-sign a patched ChromeDriver on macOS when codesign is available."""
    if sys.platform != "darwin":
        return
    try:
        subprocess.run(["codesign", "--force", "--sign", "-", path],
                       check=True, capture_output=True)
    except Exception as exc:
        logger.warning("ChromeDriver could not be ad-hoc signed (-9 risk): %s",
                       type(exc).__name__)


def get_managed_driver_path() -> str | None:
    """Resolve and patch a CPU-compatible driver without modifying Selenium's cache."""
    try:
        from selenium.webdriver.common.selenium_manager import SeleniumManager
        source = SeleniumManager().binary_paths(["--browser", "chrome"])["driver_path"]
        os.makedirs(uc.Patcher.data_path, exist_ok=True)
        target = os.path.join(uc.Patcher.data_path, "chromedriver")
        shutil.copy2(source, target)
        uc.Patcher(executable_path=target).auto()
        _adhoc_sign(target)
        return target
    except Exception as exc:
        logger.warning("Selenium Manager driver resolution failed: %s", type(exc).__name__)
        return None


def get_profile_directory_name(user_data_dir: str, account: str) -> str | None:
    """Return Chrome's internal profile directory matching an account label."""
    try:
        with open(os.path.join(user_data_dir, "Local State"), encoding="utf-8") as handle:
            info_cache = json.load(handle).get("profile", {}).get("info_cache", {})
    except (OSError, ValueError, TypeError):
        return None
    for name, profile in info_cache.items():
        if str(profile.get("user_name", "")).casefold() == account.casefold():
            return name
    if len(info_cache) == 1:
        return next(iter(info_cache))
    return None


def ensure_automation_profile(source_root: str, profile_name: str,
                              target_root: str) -> str:
    """Copy the selected Chrome profile into the bot-owned user-data directory."""
    os.makedirs(target_root, exist_ok=True)
    source_profile = os.path.join(source_root, profile_name)
    target_profile = os.path.join(target_root, profile_name)
    if os.path.isdir(target_profile):
        shutil.rmtree(target_profile)
    shutil.copytree(source_profile, target_profile)
    local_state = os.path.join(source_root, "Local State")
    if os.path.isfile(local_state):
        shutil.copy2(local_state, os.path.join(target_root, "Local State"))
    open(os.path.join(target_root, ".profile_source"), "a", encoding="utf-8").close()
    return target_profile


def get_chrome_profile() -> tuple[str, bool]:
    """Return a bot-owned profile path and whether it is the user's live profile."""
    if safe_mode:
        return get_default_temp_profile(), False
    source_root = find_default_profile_directory()
    if source_root:
        try:
            from config.secrets import username
        except ImportError:
            username = ""
        profile_name = get_profile_directory_name(source_root, username) or "Default"
        try:
            ensure_automation_profile(source_root, profile_name, AUTOMATION_PROFILE_ROOT)
        except (OSError, shutil.Error):
            pass
    os.makedirs(AUTOMATION_PROFILE_ROOT, exist_ok=True)
    return AUTOMATION_PROFILE_ROOT, False


def should_use_undetected_driver(is_real_profile: bool) -> bool:
    return not is_real_profile


def createChromeSession():
    make_directories([file_name, failed_file_name, logs_folder_path+"/screenshots", default_resume_path, generated_resume_path+"/temp"])

    if sys.platform == "darwin":
        try:
            subprocess.run(["pkill", "-f", "chromedriver"], capture_output=True)
        except Exception:
            pass

    options = Options()
    if run_in_background:   options.add_argument("--headless=new")
    if disable_extensions:  options.add_argument("--disable-extensions")

    options.add_argument("--disable-infobars")
    options.add_argument("--disable-notifications")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)

    print_lg("Opening standard Chrome browser...")
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    persistent_profile = os.path.join(project_root, "chrome_profile")
    os.makedirs(persistent_profile, exist_ok=True)

    if safe_mode:
        print_lg("Using guest profile...")
        options.add_argument(f"--user-data-dir={get_default_temp_profile()}")
    else:
        for lock_name in ["SingletonLock", "SingletonSocket", "SingletonCookie"]:
            try:
                lock_path = os.path.join(persistent_profile, lock_name)
                if os.path.exists(lock_path): os.remove(lock_path)
            except: pass
        options.add_argument(f"--user-data-dir={persistent_profile}")
        print_lg(f"Using persistent profile: {persistent_profile}")

    driver = webdriver.Chrome(options=options)
    driver.maximize_window()
    wait = WebDriverWait(driver, 10)
    actions = ActionChains(driver)
    return options, driver, actions, wait


if __name__ != "__main__":
    try:
        options, driver, actions, wait = createChromeSession()
    except Exception as e:
        msg = f"Error in opening standard Chrome: {e}"
        logger.error(msg)
        critical_error_log("In Opening Chrome", e)
        from pyautogui import alert
        alert(msg, "Error in opening chrome")
        try: driver.quit()
        except NameError: exit()
