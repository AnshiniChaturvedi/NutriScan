from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field


class SignupRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=80)
    email: str = Field(..., min_length=5, max_length=254)
    password: str = Field(..., min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=254)
    password: str = Field(..., min_length=8, max_length=128)


class AuthUser(BaseModel):
    id: str
    name: str
    email: str
    created_at: str
    search_count: int = 0


class AuthSession(BaseModel):
    token_type: str = "bearer"
    access_token: str
    user: AuthUser


class SearchHistoryCreate(BaseModel):
    query: str = Field(..., min_length=1, max_length=300)
    query_type: str = Field(default="product_search", min_length=2, max_length=40)
    product_name: Optional[str] = Field(default=None, max_length=200)
    barcode: Optional[str] = Field(default=None, max_length=32)
    result_summary: Optional[dict[str, Any]] = None


class SearchHistoryItem(BaseModel):
    id: str
    user_id: str
    query: str
    query_type: str
    product_name: Optional[str] = None
    barcode: Optional[str] = None
    result_summary: Optional[dict[str, Any]] = None
    created_at: str