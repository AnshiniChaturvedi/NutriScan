import json
import os
import subprocess
from pathlib import Path
from typing import Any


BASE_DIR = Path(__file__).resolve().parents[2]
SCRIPT_PATH = BASE_DIR / "ml" / "ingredient_model" / "frontend_infer.py"


def _python_candidates() -> list[tuple[str, list[str]]]:
    candidates: list[tuple[str, list[str]]] = []

    env_bin = os.getenv("PYTHON_BIN", "").strip()
    if env_bin:
        candidates.append((env_bin, []))

    local_win_venv = BASE_DIR / ".venv" / "Scripts" / "python.exe"
    local_unix_venv = BASE_DIR / ".venv" / "bin" / "python3"
    workspace_win_venv = BASE_DIR.parent / ".venv" / "Scripts" / "python.exe"
    workspace_unix_venv = BASE_DIR.parent / ".venv" / "bin" / "python3"

    for candidate in [local_win_venv, local_unix_venv, workspace_win_venv, workspace_unix_venv]:
        if candidate.exists():
            candidates.append((str(candidate), []))

    if os.name == "nt":
        candidates.append(("py", ["-3"]))

    candidates.append(("python", []))
    candidates.append(("python3", []))
    return candidates


def run_ml_bridge(args: list[str], timeout_seconds: int = 300) -> Any:
    if not SCRIPT_PATH.exists():
        raise RuntimeError(f"ML bridge script not found at {SCRIPT_PATH}")

    last_error = "unknown error"
    for python_bin, prefix_args in _python_candidates():
        cmd = [python_bin, *prefix_args, str(SCRIPT_PATH), *args]
        try:
            result = subprocess.run(
                cmd,
                cwd=str(BASE_DIR),
                capture_output=True,
                text=True,
                timeout=timeout_seconds,
                check=False,
                env={**os.environ, "PYTHONWARNINGS": "ignore"},
            )
        except Exception as exc:
            last_error = f"{python_bin}: {exc}"
            continue

        if result.returncode != 0:
            last_error = f"{python_bin}: {result.stderr.strip() or result.stdout.strip() or 'non-zero exit code'}"
            continue

        payload = result.stdout.strip()
        if not payload:
            last_error = f"{python_bin}: empty output"
            continue

        try:
            return json.loads(payload)
        except json.JSONDecodeError as exc:
            last_error = f"{python_bin}: invalid JSON output ({exc})"
            continue

    raise RuntimeError(f"ML bridge execution failed: {last_error}")