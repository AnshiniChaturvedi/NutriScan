import argparse
import json
import re
import sys
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import easyocr
import joblib
import numpy as np
import requests
import torch
from PIL import Image

# Ensure project root is importable when this script is executed as a file.
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.services.ml_service import (
    compute_age_group_impacts,
    compute_consumption_disclaimer,
    compute_health_score,
    compute_processing_level,
    predict_disease_risks,
)


OFF_PRODUCT_URL = "https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
OFF_SEARCH_URL = "https://world.openfoodfacts.org/cgi/search.pl"
OFF_HEADERS = {
    "User-Agent": "NutriScan-AI/1.0 frontend-ml-bridge",
    "Accept": "application/json",
}

MODEL_DIR = Path("ml/saved_models")
RF_MODEL_PATH = MODEL_DIR / "rf_feature_model.joblib"
XGB_MODEL_PATH = MODEL_DIR / "xgb_feature_model.joblib"

NUMERIC_FEATURES: List[str] = [
    "energy_kcal_100g",
    "fat_100g",
    "saturated_fat_100g",
    "sugars_100g",
    "salt_100g",
    "fiber_100g",
    "proteins_100g",
    "additives_n",
    "nova_group",
]

_ocr_reader: Optional[easyocr.Reader] = None


def _safe_float(v: Any) -> float:
    try:
        if v is None:
            return 0.0
        return float(v)
    except (TypeError, ValueError):
        return 0.0


def _to_energy_kcal(nutriments: Dict[str, Any]) -> float:
    kj = _safe_float(nutriments.get("energy-kj_100g") or nutriments.get("energy_100g"))
    if kj > 10:
        return round(kj / 4.184, 1)
    raw = _safe_float(nutriments.get("energy-kcal_100g") or nutriments.get("energy_kcal"))
    return round(raw / 4.184, 1) if raw > 900 else raw


def _parse_off_product(product: Dict[str, Any], fallback_code: str = "") -> Dict[str, Any]:
    nutriments = product.get("nutriments", {}) or {}

    normalized = {
        "sugar_100g": _safe_float(nutriments.get("sugars_100g")),
        "fat_100g": _safe_float(nutriments.get("fat_100g")),
        "saturated_fat_100g": _safe_float(nutriments.get("saturated-fat_100g")),
        "salt_100g": _safe_float(nutriments.get("salt_100g")),
        "fiber_100g": _safe_float(nutriments.get("fiber_100g") or nutriments.get("fibers_100g")),
        "additives_count": _safe_float(product.get("additives_n")),
        "energy_kcal": _to_energy_kcal(nutriments),
        "nova_group": _safe_float(product.get("nova_group")),
    }

    brand_raw = (product.get("brands") or "").strip()
    brand = brand_raw.split(",")[0].strip() if brand_raw else None

    return {
        "barcode": str(product.get("code") or fallback_code),
        "product_name": product.get("product_name"),
        "brand": brand,
        "ingredients_text": product.get("ingredients_text"),
        "nutriments": normalized,
    }


def fetch_by_barcode(barcode: str) -> Optional[Dict[str, Any]]:
    r = requests.get(OFF_PRODUCT_URL.format(barcode=barcode), headers=OFF_HEADERS, timeout=20)
    if r.status_code != 200:
        return None
    data = r.json()
    if data.get("status") != 1:
        return None
    product = data.get("product", {}) or {}
    return _parse_off_product(product, fallback_code=barcode)


def search_by_name(name: str, page_size: int = 15) -> List[Dict[str, Any]]:
    params = {
        "search_terms": name,
        "action": "process",
        "json": 1,
        "page_size": page_size,
        "fields": "code,product_name,brands,ingredients_text,nutriments,additives_n,nova_group",
    }
    r = requests.get(OFF_SEARCH_URL, params=params, headers=OFF_HEADERS, timeout=25)
    if r.status_code != 200:
        return []
    data = r.json()
    products = data.get("products", [])
    out: List[Dict[str, Any]] = []
    for p in products:
        parsed = _parse_off_product(p)
        # Accept products that have at least a name - barcode might be missing in some cases
        if parsed.get("product_name"):
            out.append(parsed)
    return out


def _get_ocr_reader() -> easyocr.Reader:
    global _ocr_reader
    if _ocr_reader is None:
        # Auto-select GPU for OCR when available (override with NUTRISCAN_OCR_GPU=0/1).
        env_gpu = os.getenv("NUTRISCAN_OCR_GPU")
        if env_gpu in {"0", "1"}:
            use_gpu = env_gpu == "1"
        else:
            use_gpu = bool(torch.cuda.is_available())
        _ocr_reader = easyocr.Reader(["en"], gpu=use_gpu)
    return _ocr_reader


def _validate_and_preprocess_image(image_path: str) -> str:
    """
    Validate and preprocess image using PIL before OCR.
    Returns validated image path or raises error.
    """
    try:
        with Image.open(image_path) as img:
            # Validate image can be opened and has valid dimensions.
            if img.size[0] < 1 or img.size[1] < 1:
                raise ValueError(f"Invalid image dimensions: {img.size}")
            # Convert RGBA to RGB if needed for compatibility.
            if img.mode in ("RGBA", "LA", "P"):
                rgb_img = Image.new("RGB", img.size, (255, 255, 255))
                rgb_img.paste(img, mask=img.split()[-1] if img.mode in ("RGBA", "LA") else None)
                temp_path = image_path + ".processed.png"
                rgb_img.save(temp_path, "PNG")
                return temp_path
        return image_path
    except Exception as e:
        raise ValueError(f"Image validation failed: {str(e)}")


def _extract_text_from_image(image_path: str) -> str:
    # Validate and preprocess image first.
    processed_path = _validate_and_preprocess_image(image_path)
    try:
        reader = _get_ocr_reader()
        blocks = reader.readtext(processed_path, detail=0)
        return " ".join(blocks).strip()
    finally:
        # Clean up temporary processed image if created.
        if processed_path != image_path and Path(processed_path).exists():
            try:
                Path(processed_path).unlink()
            except Exception:
                pass


def _barcode_candidates(text: str) -> List[str]:
    if not text:
        return []
    compact = re.sub(r"[^0-9]", " ", text)
    raw = re.findall(r"\b\d{8,14}\b", compact)
    # Longer candidates are usually more likely to be EAN13/UPC.
    uniq = sorted(set(raw), key=lambda x: (-len(x), x))
    return uniq


def analyze_from_image(image_path: str) -> Dict[str, Any]:
    ocr_text = _extract_text_from_image(image_path)

    # 1) Prefer barcode detection from OCR text.
    for code in _barcode_candidates(ocr_text):
        product = fetch_by_barcode(code)
        if product:
            out = analyze_product(product)
            out["ocr_text"] = ocr_text
            out["detected_barcode"] = code
            return out

    # 2) Fallback to product-name search from OCR words.
    words = re.findall(r"[A-Za-z][A-Za-z0-9\-]{2,}", ocr_text)
    if words:
        query = " ".join(words[:6])
        candidates = search_by_name(query, page_size=12)
        if candidates:
            out = analyze_product(candidates[0])
            out["ocr_text"] = ocr_text
            out["detected_barcode"] = None
            return out

    return {
        "error": "Could not detect a valid product from image OCR.",
        "ocr_text": ocr_text,
    }


def _ml_vector(nutriments: Dict[str, float]) -> np.ndarray:
    x = np.array(
        [
            _safe_float(nutriments.get("energy_kcal")),
            _safe_float(nutriments.get("fat_100g")),
            _safe_float(nutriments.get("saturated_fat_100g")),
            _safe_float(nutriments.get("sugar_100g")),
            _safe_float(nutriments.get("salt_100g")),
            _safe_float(nutriments.get("fiber_100g")),
            0.0,
            _safe_float(nutriments.get("additives_count")),
            _safe_float(nutriments.get("nova_group")),
        ],
        dtype=float,
    ).reshape(1, -1)
    return x


def ml_predict_flags(nutriments: Dict[str, float]) -> Dict[str, Any]:
    if not (RF_MODEL_PATH.exists() and XGB_MODEL_PATH.exists()):
        return {"model_ready": False, "ml_feature_probabilities": {}, "ml_flags": {}}

    rf = joblib.load(RF_MODEL_PATH)
    xgb = joblib.load(XGB_MODEL_PATH)
    x = _ml_vector(nutriments)

    labels = rf.get("label_columns", [])
    rf_probs = np.array([(p[:, 1] if p.shape[1] > 1 else p[:, 0]) for p in rf["model"].predict_proba(x)]).reshape(-1)

    if xgb.get("mode") == "per_label":
        xgb_models = xgb["models"]
        xgb_probs = []
        for lb in labels:
            p = xgb_models[lb].predict_proba(x)
            xgb_probs.append((p[:, 1] if p.shape[1] > 1 else p[:, 0])[0])
        xgb_probs = np.array(xgb_probs, dtype=float)
    else:
        xgb_probs = np.array([(p[:, 1] if p.shape[1] > 1 else p[:, 0]) for p in xgb["model"].predict_proba(x)]).reshape(-1)

    ens = (rf_probs + xgb_probs) / 2.0
    rf_thr = np.array(rf.get("thresholds", [0.5] * len(labels)), dtype=float)
    xgb_thr = np.array(xgb.get("thresholds", [0.5] * len(labels)), dtype=float)
    thr = (rf_thr + xgb_thr) / 2.0
    flags = (ens >= thr).astype(int)

    return {
        "model_ready": True,
        "ml_feature_probabilities": {labels[i]: float(round(float(ens[i]), 4)) for i in range(len(labels))},
        "ml_flags": {labels[i]: int(flags[i]) for i in range(len(labels))},
    }


def analyze_product(product: Dict[str, Any]) -> Dict[str, Any]:
    nutriments = product["nutriments"]
    ingredients_text = product.get("ingredients_text") or ""

    health_score = compute_health_score(nutriments)
    disease_risks = predict_disease_risks(nutriments)
    processing_level = compute_processing_level(nutriments, ingredients_text)
    age_group_impacts = compute_age_group_impacts(nutriments)
    consumption_disclaimer = compute_consumption_disclaimer(nutriments, health_score)
    ml_output = ml_predict_flags(nutriments)

    return {
        "product": product,
        "health_score": health_score,
        "disease_risks": disease_risks,
        "processing_level": processing_level,
        "age_group_impacts": age_group_impacts,
        "consumption_disclaimer": consumption_disclaimer,
        "ingredient_analysis": None,
        **ml_output,
    }


def recommendations_for(barcode: str, limit: int = 4) -> List[Dict[str, Any]]:
    base = fetch_by_barcode(barcode)
    if not base:
        return []

    query = (base.get("product_name") or "").split(" ")[0] or barcode
    candidates = search_by_name(query, page_size=30)

    ranked: List[Dict[str, Any]] = []
    for item in candidates:
        if item.get("barcode") == barcode:
            continue
        analyzed = analyze_product(item)
        ranked.append(
            {
                "product": analyzed["product"],
                "health_score": analyzed["health_score"],
                "disease_risks": analyzed["disease_risks"],
            }
        )

    ranked.sort(key=lambda x: x["health_score"], reverse=True)
    return ranked[:limit]


def main() -> None:
    parser = argparse.ArgumentParser(description="Frontend ML bridge inference")
    sub = parser.add_subparsers(dest="command", required=True)

    p_scan = sub.add_parser("scan")
    p_scan.add_argument("--barcode", required=True)

    p_analyze = sub.add_parser("analyze")
    p_analyze.add_argument("--barcode", default="")
    p_analyze.add_argument("--product-name", default="")

    p_reco = sub.add_parser("recommend")
    p_reco.add_argument("--barcode", required=True)
    p_reco.add_argument("--limit", type=int, default=4)

    p_img = sub.add_parser("analyze-image")
    p_img.add_argument("--image", required=True)

    args = parser.parse_args()

    try:
        if args.command == "scan":
            product = fetch_by_barcode(args.barcode)
            if not product:
                print(json.dumps({"error": "Product not found"}))
                return
            print(json.dumps(product))
            return

        if args.command == "analyze":
            product = None
            if args.barcode:
                product = fetch_by_barcode(args.barcode)
            if not product and args.product_name:
                results = search_by_name(args.product_name, page_size=10)
                product = results[0] if results else None

            if not product:
                print(json.dumps({"error": "Product not found"}))
                return

            print(json.dumps(analyze_product(product)))
            return

        if args.command == "recommend":
            items = recommendations_for(args.barcode, limit=args.limit)
            print(json.dumps(items))
            return

        if args.command == "analyze-image":
            result = analyze_from_image(args.image)
            print(json.dumps(result))
            return

    except Exception as exc:  # noqa: BLE001
        print(json.dumps({"error": str(exc)}))


if __name__ == "__main__":
    main()
