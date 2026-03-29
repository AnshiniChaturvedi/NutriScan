from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Central configuration for NutriScan AI.

    Values are loaded from environment variables or a `.env` file.
    This keeps secrets (like API keys) out of the code.
    """

    # General
    ENV: str = "development"
    DEBUG: bool = True

    # External APIs
    OPENFOODFACTS_BASE_URL: str = "https://world.openfoodfacts.org/api/v0"

    # LLM / Gemini
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "models/gemini-2.0-flash"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """
    Cached settings instance so configuration is loaded only once.
    """
    return Settings()

