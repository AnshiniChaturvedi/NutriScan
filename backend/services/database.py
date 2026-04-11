from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Any, Optional
from uuid import uuid4

from ..config import get_settings


BACKEND_ROOT = Path(__file__).resolve().parent.parent


def get_database_path() -> Path:
    settings = get_settings()
    database_path = Path(settings.DATABASE_PATH)
    if not database_path.is_absolute():
        database_path = BACKEND_ROOT / database_path
    database_path.parent.mkdir(parents=True, exist_ok=True)
    return database_path


def get_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(get_database_path())
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def initialize_database() -> None:
    with get_connection() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                password_salt TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS search_history (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                query TEXT NOT NULL,
                query_type TEXT NOT NULL,
                product_name TEXT,
                barcode TEXT,
                result_summary TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_search_history_user_created_at
            ON search_history(user_id, created_at DESC);
            """
        )


def _row_to_dict(row: Optional[sqlite3.Row]) -> Optional[dict[str, Any]]:
    if row is None:
        return None
    return dict(row)


def fetch_user_by_email(email: str) -> Optional[dict[str, Any]]:
    with get_connection() as connection:
        row = connection.execute(
            "SELECT id, name, email, password_hash, password_salt, created_at FROM users WHERE email = ?",
            (email.lower().strip(),),
        ).fetchone()
        return _row_to_dict(row)


def fetch_user_by_id(user_id: str) -> Optional[dict[str, Any]]:
    with get_connection() as connection:
        row = connection.execute(
            "SELECT id, name, email, password_hash, password_salt, created_at FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
        return _row_to_dict(row)


def count_search_history(user_id: str) -> int:
    with get_connection() as connection:
        row = connection.execute(
            "SELECT COUNT(*) AS total FROM search_history WHERE user_id = ?",
            (user_id,),
        ).fetchone()
        return int(row["total"] if row else 0)


def create_user(*, name: str, email: str, password_hash: str, password_salt: str) -> dict[str, Any]:
    user_id = uuid4().hex
    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO users (id, name, email, password_hash, password_salt)
            VALUES (?, ?, ?, ?, ?)
            """,
            (user_id, name.strip(), email.lower().strip(), password_hash, password_salt),
        )

    user = fetch_user_by_id(user_id)
    if user is None:
        raise RuntimeError("Failed to create user record.")
    return user


def add_search_history(
    *,
    user_id: str,
    query: str,
    query_type: str,
    product_name: Optional[str] = None,
    barcode: Optional[str] = None,
    result_summary: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    history_id = uuid4().hex
    payload = json.dumps(result_summary, ensure_ascii=False) if result_summary is not None else None

    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO search_history (
                id,
                user_id,
                query,
                query_type,
                product_name,
                barcode,
                result_summary
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                history_id,
                user_id,
                query.strip(),
                query_type.strip(),
                product_name.strip() if product_name else None,
                barcode.strip() if barcode else None,
                payload,
            ),
        )

    return fetch_search_history_item(history_id) or {}


def fetch_search_history_item(history_id: str) -> Optional[dict[str, Any]]:
    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT id, user_id, query, query_type, product_name, barcode, result_summary, created_at
            FROM search_history
            WHERE id = ?
            """,
            (history_id,),
        ).fetchone()

    item = _row_to_dict(row)
    if item and item.get("result_summary"):
        try:
            item["result_summary"] = json.loads(item["result_summary"])
        except json.JSONDecodeError:
            item["result_summary"] = None
    return item


def list_search_history(user_id: str, limit: int = 20) -> list[dict[str, Any]]:
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT id, user_id, query, query_type, product_name, barcode, result_summary, created_at
            FROM search_history
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (user_id, limit),
        ).fetchall()

    history: list[dict[str, Any]] = []
    for row in rows:
        item = dict(row)
        if item.get("result_summary"):
            try:
                item["result_summary"] = json.loads(item["result_summary"])
            except json.JSONDecodeError:
                item["result_summary"] = None
        history.append(item)
    return history