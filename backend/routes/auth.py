from __future__ import annotations

import re
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from ..models.auth_schemas import (
    AuthSession,
    AuthUser,
    LoginRequest,
    SearchHistoryCreate,
    SearchHistoryItem,
    SignupRequest,
)
from ..services.database import (
    add_search_history,
    count_search_history,
    create_user,
    fetch_user_by_email,
    fetch_user_by_id,
    list_search_history,
)
from ..services.security import build_access_token, decode_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])

EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
NAME_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9 ._'-]{1,79}$")


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _validate_email(email: str) -> None:
    if not EMAIL_PATTERN.match(email):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Enter a valid email address.")


def _validate_name(name: str) -> None:
    if not NAME_PATTERN.match(name.strip()):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Name must be 2 to 80 characters and start with a letter or number.",
        )


def _validate_password(password: str) -> None:
    if len(password) < 8:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Password must be at least 8 characters long.")
    if not re.search(r"[A-Za-z]", password) or not re.search(r"\d", password):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password must include at least one letter and one number.",
        )


def _user_response(user: dict[str, Any]) -> AuthUser:
    return AuthUser(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        created_at=user["created_at"],
        search_count=count_search_history(user["id"]),
    )


def _session_response(user: dict[str, Any]) -> AuthSession:
    token = build_access_token({"sub": user["id"], "email": user["email"], "name": user["name"]})
    return AuthSession(access_token=token, user=_user_response(user))


def get_current_user(request: Request) -> dict[str, Any]:
    header = request.headers.get("Authorization", "")
    token = header.split(" ", 1)[1].strip() if header.lower().startswith("bearer ") and " " in header else ""
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated.")

    try:
        payload = decode_access_token(token)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token.") from exc

    user_id = str(payload.get("sub") or "")
    user = fetch_user_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")
    return user


@router.post("/signup", response_model=AuthSession)
def signup(payload: SignupRequest) -> AuthSession:
    name = payload.name.strip()
    email = _normalize_email(payload.email)

    _validate_name(name)
    _validate_email(email)
    _validate_password(payload.password)

    if fetch_user_by_email(email) is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists.")

    salt, password_hash = hash_password(payload.password)
    user = create_user(name=name, email=email, password_hash=password_hash, password_salt=salt)
    return _session_response(user)


@router.post("/login", response_model=AuthSession)
def login(payload: LoginRequest) -> AuthSession:
    email = _normalize_email(payload.email)
    _validate_email(email)

    user = fetch_user_by_email(email)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    if not verify_password(payload.password, user["password_salt"], user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    return _session_response(user)


@router.get("/me", response_model=AuthUser)
def me(user: dict[str, Any] = Depends(get_current_user)) -> AuthUser:
    return _user_response(user)


@router.post("/logout")
def logout() -> dict[str, str]:
    return {"message": "Logged out successfully."}


@router.get("/history", response_model=list[SearchHistoryItem])
def history(
    request: Request,
    limit: int = Query(default=20, ge=1, le=100),
) -> list[SearchHistoryItem]:
    user = get_current_user(request)
    rows = list_search_history(user["id"], limit=limit)
    return [SearchHistoryItem(**row) for row in rows]


@router.post("/history", response_model=SearchHistoryItem)
def save_history(payload: SearchHistoryCreate, request: Request) -> SearchHistoryItem:
    user = get_current_user(request)
    row = add_search_history(
        user_id=user["id"],
        query=payload.query,
        query_type=payload.query_type,
        product_name=payload.product_name,
        barcode=payload.barcode,
        result_summary=payload.result_summary,
    )
    return SearchHistoryItem(**row)