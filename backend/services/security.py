from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
import time
from typing import Any

from ..config import get_settings

PASSWORD_ITERATIONS = 210_000


def _urlsafe_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")


def _urlsafe_decode(token: str) -> bytes:
    padding = "=" * (-len(token) % 4)
    return base64.urlsafe_b64decode(token + padding)


def hash_password(password: str, salt: str | None = None) -> tuple[str, str]:
    password_salt = salt or secrets.token_hex(16)
    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        password_salt.encode("utf-8"),
        PASSWORD_ITERATIONS,
    )
    return password_salt, _urlsafe_encode(password_hash)


def verify_password(password: str, salt: str, expected_hash: str) -> bool:
    _, actual_hash = hash_password(password, salt)
    return secrets.compare_digest(actual_hash, expected_hash)


def build_access_token(payload: dict[str, Any], expires_in_minutes: int | None = None) -> str:
    settings = get_settings()
    issued_at = int(time.time())
    expiry_minutes = expires_in_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES
    token_payload = {
        **payload,
        "iss": settings.JWT_ISSUER,
        "aud": settings.JWT_AUDIENCE,
        "iat": issued_at,
        "exp": issued_at + expiry_minutes * 60,
    }

    header = {"alg": "HS256", "typ": "JWT"}
    header_segment = _urlsafe_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_segment = _urlsafe_encode(json.dumps(token_payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{header_segment}.{payload_segment}".encode("ascii")
    signature = hmac.new(
        settings.JWT_SECRET_KEY.encode("utf-8"),
        signing_input,
        hashlib.sha256,
    ).digest()
    return f"{header_segment}.{payload_segment}.{_urlsafe_encode(signature)}"


def decode_access_token(token: str) -> dict[str, Any]:
    settings = get_settings()
    try:
        header_segment, payload_segment, signature_segment = token.split(".")
    except ValueError as exc:
        raise ValueError("Invalid token format") from exc

    signing_input = f"{header_segment}.{payload_segment}".encode("ascii")
    expected_signature = hmac.new(
        settings.JWT_SECRET_KEY.encode("utf-8"),
        signing_input,
        hashlib.sha256,
    ).digest()

    actual_signature = _urlsafe_decode(signature_segment)
    if not secrets.compare_digest(expected_signature, actual_signature):
        raise ValueError("Invalid token signature")

    try:
        payload = json.loads(_urlsafe_decode(payload_segment).decode("utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError("Invalid token payload") from exc

    if payload.get("iss") != settings.JWT_ISSUER or payload.get("aud") != settings.JWT_AUDIENCE:
        raise ValueError("Token audience mismatch")

    exp = int(payload.get("exp", 0))
    if exp and exp < int(time.time()):
        raise ValueError("Token expired")

    return payload