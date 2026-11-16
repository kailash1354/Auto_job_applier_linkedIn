# LinkedIn AI Auto Job Applier — Codebase Orientation

This document records the behavior and structure observed in the repository. It is an onboarding map, not a code review. Credential values, API keys, browser cookies, and other local secrets are intentionally not reproduced here.

## 1-Line Summary

This is a local Python application that uses Flask for configuration/run control and Selenium/Chrome automation to search LinkedIn, filter jobs, answer Easy Apply questions, submit or collect applications, and write CSV/log history.

## 5-Minute Explanation

### Primary tasks

- Start a localhost-only control panel.
- Display a schema-driven form for account, profile, search, filtering, and run settings.
- Save settings into `user_config.json` without modifying the classic `config/*.py` files.
- Launch and stop `runAiBot.py` as a child process.
- Open Chrome, reuse a persistent browser profile, log into LinkedIn, search configured job terms, apply filters, inspect job details, and process Easy Apply or external application links.
- Optionally use LangChain/LangGraph with OpenAI-compatible providers or Gemini to extract skills and answer free-text/application questions.
- Persist applied jobs and failed/skipped jobs in CSV files and write rotating logs.

### Main inputs

- Configuration defaults in `config/personals.py`, `config/questions.py`, `config/search.py`, `config/secrets.py`, and `config/settings.py`.
- Optional overrides in root-level `user_config.json`.
- LinkedIn pages rendered in the Selenium browser.
- A resume at `default_resume_path`.
- Optional AI provider/model/API settings.

### Main outputs

- LinkedIn applications submitted through Easy Apply when submission is enabled.
- External application URLs recorded for jobs that leave LinkedIn.
- `all excels/all_applied_applications_history.csv`.
- `all excels/all_failed_applications_history.csv`.
- `logs/log.txt` plus rotated log files and screenshots under the configured logs path.
- Control-panel JSON responses and live bot output in `.bot_run.log`.

### Main execution paths

1. `start.sh`, `start.command`, or `start.bat` creates `.venv`, installs dependencies, and starts `app.py`.
2. `app.py` serves `templates/control_panel.html` on `127.0.0.1` and exposes the configuration/run APIs.
3. `/api/run` starts `runAiBot.py` in a separate process and redirects its stdout/stderr to `.bot_run.log`.
4. `runAiBot.main()` validates configuration, creates a Chrome session through `modules/open_chrome.py`, checks/login to LinkedIn, optionally creates an AI client, and calls `run()`.
5. `run()` calls `apply_to_jobs()`, which searches terms, applies filters, walks job cards/pages, rejects jobs using configured rules, and processes Easy Apply or external applications.
6. Successful or skipped/failed outcomes are written through helpers in `runAiBot.py`; logging is centralized in `modules/helpers.py`.

## Runtime Architecture

| Layer | Files | Responsibility |
|---|---|---|
| Launcher | `start.sh`, `start.command`, `start.bat` | Cross-platform environment setup and control-panel startup |
| Control panel | `app.py`, `templates/control_panel.html` | Local UI, config persistence, process lifecycle, logs, update checks |
| Configuration | `config/*.py`, `config/_overrides.py`, `config_schema.py` | Defaults, JSON override loading, field metadata, validation inputs |
| Browser bootstrap | `modules/open_chrome.py` | Chrome options/profile/driver creation and Selenium objects |
| Automation orchestration | `runAiBot.py` | LinkedIn login, search, filtering, job evaluation, applications, CSV outcomes |
| Selenium helpers | `modules/clickers_and_finders.py` | Locators, waits, scrolling, clicking, text entry, filter selection |
| General utilities | `modules/helpers.py` | Logging, directory creation, humanized typing, parsing, date/CSV helpers |
| AI integration | `modules/ai/connections.py`, `modules/ai/prompts.py` | Provider setup, structured skill extraction, question-answer graph |
| Maintenance | `modules/updater.py` | Version comparison and guarded fast-forward update |
| Tests | `tests/` | Unit/integration-style checks using fixtures and monkeypatching |

## Entry Points

### `app.py`

The local Flask server is the normal user-facing entry point. It binds to `127.0.0.1`, keeps debug mode off, chooses a free port when needed, and may open the browser when `PANEL_OPEN_BROWSER` is set.

Important routes:

- `/`: renders the control panel.
- `/history`: renders the applied-jobs history page.
- `/api/schema`: returns `config_schema.SCHEMA`.
- `/api/config` (`GET`/`POST`): reads effective settings or validates/coerces and saves overrides.
- `/api/run`: starts one `runAiBot.py` subprocess and writes its PID.
- `/api/stop`: terminates the bot process/process group where possible.
- `/api/status`: reports the tracked subprocess state.
- `/api/logs`: returns incremental log content using a byte offset.
- `/api/update-check` and `/api/update`: check the published `VERSION` and perform the guarded updater flow.
- `/applied-jobs` (`GET`) and `/applied-jobs/<job_id>` (`PUT`): serve and update the history page's CSV-backed data.

### `runAiBot.py`

This is the browser automation entry point. Importing it also imports `modules/open_chrome.py`, which creates the global Selenium `driver`, `actions`, and `wait` objects.

The normal call chain is:

`main()` → `validate_config()` → Chrome/LinkedIn login → optional `create_ai_client()` → `run()` → `apply_to_jobs()`.

`run_non_stop` can repeat cycles, optionally alternating `sort_by` and cycling `date_posted`. A daily Easy Apply limit stops further processing when detected.

## Configuration and Precedence

Each config module defines shipped defaults and ends by calling `_overrides.apply(...)`. The override loader reads root-level `user_config.json`; only keys already defined by the module are applied.

`config_schema.py` is the single metadata source used by the control panel. It groups fields into Account, Profile, Search, Filters, and Run settings and defines UI types such as `text`, `password`, `number`, `bool`, `select`, and `list`.

The effective value precedence is:

1. A value in `user_config.json`, if present and valid for the matching known key.
2. Otherwise the value defined in the relevant `config/*.py` module.

`app.py` captures pristine defaults with overrides temporarily disabled, then overlays the current JSON file for `/api/config`. POSTed values are coerced according to the schema and unknown modules/keys are rejected.

Configuration ownership:

- `config/personals.py`: identity, contact/address, and equal-opportunity answers.
- `config/questions.py`: resume path, experience, salary/CTC, notice period, authorization, profile text, application pauses, and answer behavior.
- `config/search.py`: search terms/location, LinkedIn filters, experience/degree/clearance filters, bad/good words, and sponsorship phrases.
- `config/secrets.py`: LinkedIn credentials and AI provider settings. Do not commit populated secrets.
- `config/settings.py`: browser/runtime behavior, output paths, timing, logging, driver management, and safety options.
- `config_schema.py`: UI field definitions and allowed values, not runtime orchestration.

## Detailed Application Flow

### 1. Browser and session setup

`modules/open_chrome.py` creates output directories, selects `undetected_chromedriver` or Selenium based on `auto_manage_driver`, adds headless/extension/browser flags, and configures a persistent Chrome profile. On macOS it can use the real Chrome user-data directory; otherwise it uses the repository's `chrome_profile` directory. If profile startup fails, it falls back to a temporary profile.

The returned global objects are used by `runAiBot.py`: `driver`, `actions`, and a five-second `WebDriverWait` instance.

### 2. Login

`is_logged_in_LN()` checks the feed URL and visible login/join controls. `login_LN()` navigates to LinkedIn login, fills the first displayed email/password fields, clicks the exact visible `Sign in` button, and falls back to a saved-profile button or manual retry when automatic login does not succeed.

Non-interactive/background runs suppress `pyautogui` dialogs and log the message instead, preventing a subprocess launched by the control panel from hanging on a desktop dialog.

### 3. Search and filters

`apply_to_jobs()` iterates configured `search_terms`, optionally shuffles them, opens LinkedIn job search, sets location, and calls `apply_filters()`.

`apply_filters()` handles LinkedIn's `All filters` dialog and attempts configured sort/date, experience, company, job type, work setting, Easy Apply, location, industry, function, title, applicant/network/fair-chance, salary, benefits, and commitment filters. It optionally pauses after filtering only in an interactive session.

### 4. Job card and description evaluation

`get_job_main_details()` extracts job ID, title, company, location, and work style from a job card, then skips already-applied, blacklisted, or previously rejected jobs.

`get_job_description()` reads the job page and applies configured rejection rules, including:

- Bad words in the job description.
- Required experience compared with `current_experience`.
- Master's-degree and security-clearance conditions.
- Company “About” good/bad word rules.
- Sponsorship-offered/unavailable phrase rules.

`find_bad_word()` performs case-insensitive whole-word/phrase matching. This is reused for question-label classification to avoid substring collisions such as `state` inside `United States`.

### 5. Easy Apply

The bot tries multiple Easy Apply locators and confirms that a modal opened. It then loops through modal pages:

1. `answer_questions()` inspects labels and control types.
2. Known fields are answered from configured personal/profile values.
3. Select/radio answers use `match_answer_to_option()` to find an honest matching option.
4. Upload fields use `upload_resume()`.
5. Unknown or difficult questions may be answered through the AI graph when enabled; legal/attestation-style checkboxes are deliberately not auto-ticked.
6. The loop advances through `Next` until `Review`.
7. `stop_before_submit` discards at Review and counts the job as skipped.
8. `pause_before_submit` can ask the user to review before submitting.
9. The normal path clicks `Submit application`, confirms `Done`, and records the result.

If required questions remain unanswered across repeated passes, `UnansweredQuestions` causes the job to be discarded as a skip rather than logged as a technical failure. A hard loop limit also marks the application as stuck.

### 6. External applications

If clicking an application control opens a new tab or does not produce an Easy Apply modal, `external_apply()` treats the job as external. It collects the external link, handles tab switching/optional closing, and records the job rather than submitting an external form.

### 7. History and failure handling

`submitted_jobs()` appends successful Easy Apply and external-link results to the configured applied-history CSV. `failed_job()` writes failed or rejected details to the failed-history CSV and may include a screenshot path. The main counters distinguish Easy Applied, external links, failures, and skips.

## AI Layer

`modules/ai/connections.py` exposes four public operations used by `runAiBot.py`:

- `create_ai_client()` maps Gemini to `google_genai`; OpenAI, DeepSeek, Ollama, LM Studio, vLLM, and other compatible services use the OpenAI provider path with a configurable base URL.
- `extract_skills()` requests structured output using the `ExtractedSkills` Pydantic model and falls back to plain JSON parsing if structured output is unsupported.
- `answer_question()` invokes a compiled LangGraph pipeline.
- `close_ai_client()` is an interface placeholder because the configured LangChain model does not hold a long-lived connection that needs closing.

The question graph is:

`build_prompt` → `generate` → `format_text` for free text, or `select_option` for single/multiple-select questions.

The prompt receives applicant information, the question, optional job description/company context, and allowed options. AI failures are logged and return an empty answer; optional GUI error alerts can be paused.

## Persistence and Runtime Files

- `user_config.json`: control-panel overrides; may contain credentials and API keys.
- `all excels/all_applied_applications_history.csv`: successful applications and external links.
- `all excels/all_failed_applications_history.csv`: failed/skipped application records.
- `logs/log.txt`: rotating timestamped logger output; up to three backups are configured.
- `.bot_run.log`: current bot subprocess output polled by the control panel.
- `.bot_run.pid`: tracked subprocess PID while a run is active.
- `chrome_profile/`: Chromium profile/cache/cookies/local browser state; it is runtime data, not source code.
- `all resumes/`: user-provided resume files and generated-resume workspace.

## Tests and Fixtures

The `tests/` package covers configuration overrides, Flask integration, driver architecture, helper behavior, logging, question matching, sponsorship logic, selector ground truth, updater behavior, and recent runtime fixes. HTML files under `tests/fixtures/` represent LinkedIn page fragments used by tests.

The repository also contains local runner scripts:

- `run_tests.sh`, `run_tests.command`, `run_tests.bat`: install development requirements and run pytest.
- `test_run.py`: manually exercises a search workflow with `stop_before_submit = True`.
- `test_trial_run.py`: manually exercises a live application workflow.
- `run_ten_jobs.py`: manually exercises a target application run.

The manual runner files import `runAiBot` directly, so importing them initializes a browser session before their workflow code begins.

## Maintenance and Updates

`modules/updater.py` compares the local `VERSION` file with the raw `main` branch version. `self_update()` verifies the Git remote belongs to the expected repository, stashes tracked edits, runs `git pull --ff-only`, and removes `.venv/.deps_installed` after a successful update so dependencies are reinstalled on the next launcher run. On failure it attempts to restore the stash.

`app.py` calls `_freeze_config()` before updating, copying the current effective schema values into `user_config.json` so a hand-edited configuration is not lost when tracked config files change.

## Files Inspected

### Application source

`app.py`, `runAiBot.py`, `config_schema.py`, `config/_overrides.py`, `config/personals.py`, `config/questions.py`, `config/search.py`, `config/secrets.py`, `config/settings.py`, `modules/helpers.py`, `modules/clickers_and_finders.py`, `modules/open_chrome.py`, `modules/validator.py`, `modules/updater.py`, `modules/ai/connections.py`, and `modules/ai/prompts.py`.

### UI, launchers, tests, and project documentation

`templates/control_panel.html`, `templates/index.html`, the `start.*` and `run_tests.*` launchers, `run_ten_jobs.py`, `test_run.py`, `test_trial_run.py`, `tests/`, `README.md`, `docs/`, `CONTRIBUTING.md`, `LICENSE`, `NOTICE`, `VERSION`, `requirements.txt`, `requirements-dev.txt`, and `pytest.ini`.

### Deliberately excluded from the source map

`.venv/`, `.git/`, `chrome_profile/`, generated logs, caches, cookies, browser databases, and other machine-generated runtime artifacts. They were identified as environment/runtime state rather than application implementation.
