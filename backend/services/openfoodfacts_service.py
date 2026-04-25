from typing import Optional

import httpx

from ..config import get_settings
from ..models.schemas import ProductDetails

_OFF_SEARCH_URL = "https://world.openfoodfacts.org/cgi/search.pl"


def _parse_product_dict(barcode: str, product: dict) -> ProductDetails:
    """
    Shared helper: turn a raw OpenFoodFacts product dict into ProductDetails.
    Handles the energy kJ/kcal ambiguity: OFF sometimes stores kJ in the
    energy-kcal_100g field (values > 900 are impossible as kcal/100g, so we
    convert them from kJ).
    """
    nutriments = product.get("nutriments", {}) or {}

    fiber_val = (
        nutriments.get("fiber_100g")
        or nutriments.get("fibers_100g")
        or 0.0
    )

    # Energy: prefer energy-kj_100g (always in kJ) → convert to kcal.
    # Fall back to energy_100g (also kJ). Avoid energy-kcal_100g because
    # OpenFoodFacts frequently stores kJ there by mistake.
    _kj = float(
        nutriments.get("energy-kj_100g")
        or nutriments.get("energy_100g")
        or 0.0
    )
    # If kj value is suspiciously small (<10), it might already be kcal — pass through.
    if _kj > 10:
        energy_kcal = round(_kj / 4.184, 1)
    else:
        # Last resort: use the kcal field but guard against kJ mis-labelling (>900 → convert)
        _raw = float(nutriments.get("energy-kcal_100g") or nutriments.get("energy_kcal") or 0.0)
        energy_kcal = round(_raw / 4.184, 1) if _raw > 900 else _raw

    normalized_nutriments = {
        "sugar_100g":         float(nutriments.get("sugars_100g") or 0.0),
        "fat_100g":           float(nutriments.get("fat_100g") or 0.0),
        "saturated_fat_100g": float(nutriments.get("saturated-fat_100g") or 0.0),
        "salt_100g":          float(nutriments.get("salt_100g") or 0.0),
        "fiber_100g":         float(fiber_val),
        "proteins_100g":      float(nutriments.get("proteins_100g") or 0.0),
        "additives_count":    float(product.get("additives_n") or 0.0),
        "energy_kcal":        energy_kcal,
        "nova_group":         float(product.get("nova_group") or 0.0),
    }

    return ProductDetails(
        barcode=barcode,
        product_name=product.get("product_name"),
        brand=(product.get("brands") or "").split(",")[0].strip() or None,
        ingredients_text=product.get("ingredients_text"),
        nutriments=normalized_nutriments,
    )


async def search_product_by_name(name: str) -> Optional[ProductDetails]:
    """
    Search OpenFoodFacts by product name and return the best match.
    Returns None if no suitable product is found.
    """
    params = {
        "search_terms": name,
        "action": "process",
        "json": 1,
        "page_size": 10,
        "fields": "code,product_name,brands,ingredients_text,nutriments,additives_n,nova_group",
    }
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            response = await client.get(_OFF_SEARCH_URL, params=params)
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPError:
        return None

    products = data.get("products", [])
    # Pick first product that has both a name and a barcode
    for p in products:
        if p.get("product_name") and p.get("code"):
            return _parse_product_dict(p["code"], p)

    return None


async def fetch_product_by_barcode(barcode: str) -> Optional[ProductDetails]:
    """
    Fetch product information from the OpenFoodFacts API using a barcode.

    Returns:
        ProductDetails if the product is found, otherwise None.
    """
    settings = get_settings()
    url = f"{settings.OPENFOODFACTS_BASE_URL}/product/{barcode}.json"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPError:
        return None

    if data.get("status") != 1:
        return None

    product = data.get("product", {}) or {}
    return _parse_product_dict(barcode, product)


