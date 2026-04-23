import re
from typing import List


SEPARATOR_PATTERN = re.compile(r"[;,·•\-\u2022]+")  # common separators + bullets
PUNCTUATION_PATTERN = re.compile(r"[^\w\s\-]+", flags=re.UNICODE)
WHITESPACE_PATTERN = re.compile(r"\s+")


def normalize_text(text: str) -> str:
    """
    Basic, multilingual-safe text normalization for ingredient strings.

    - Lowercases.
    - Normalizes common separators to commas.
    - Removes most punctuation while preserving word characters and dashes.
    - Collapses repeated whitespace.
    """
    if not text:
        return ""

    # Lowercase but keep Unicode characters (for accents / non-English).
    text = text.lower()

    # Normalize common list separators (semicolon, bullet, etc.) into commas.
    text = SEPARATOR_PATTERN.sub(",", text)

    # Remove most punctuation while keeping alphanumerics and spaces/dashes.
    text = PUNCTUATION_PATTERN.sub(" ", text)

    # Normalize whitespace.
    text = WHITESPACE_PATTERN.sub(" ", text).strip()
    return text


def split_ingredients(text: str) -> List[str]:
    """
    Split a raw ingredient string into individual ingredients.

    Handles:
    - Comma- or semicolon-separated lists.
    - Mixed separators from different languages.
    """
    if not text:
        return []

    # First, normalize to lowercase and standard separators.
    normalized = normalize_text(text)

    # Split on commas (already normalized from various separators).
    parts = [p.strip() for p in normalized.split(",")]
    return [p for p in parts if p]


def preprocess_ingredients(text: str) -> str:
    """
    High-level preprocessing entry point.

    Returns a cleaned, normalized string suitable for embedding models.
    When calling the embedder, you can either:
    - Use this normalized full string, or
    - Join split ingredients with a delimiter if you want more granularity.
    """
    return normalize_text(text)

