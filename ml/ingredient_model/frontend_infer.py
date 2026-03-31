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
import pandas as pd
import requests
import torch
from PIL import Image
from PIL import ImageEnhance

# Ensure project root is importable when this script is executed as a file.
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


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
        texts: List[str] = []

        # Pass 1: raw image.
        blocks = reader.readtext(processed_path, detail=0)
        if blocks:
            texts.append(" ".join(blocks).strip())

        # Pass 2: grayscale + boosted contrast for faint labels/barcodes.
        with Image.open(processed_path) as img:
            gray = img.convert("L")
            contrast = ImageEnhance.Contrast(gray).enhance(2.0)
            ocr_path = processed_path + ".ocr.png"
            contrast.save(ocr_path, "PNG")
        try:
            blocks2 = reader.readtext(ocr_path, detail=0)
            if blocks2:
                texts.append(" ".join(blocks2).strip())
        finally:
            if Path(ocr_path).exists():
                try:
                    Path(ocr_path).unlink()
                except Exception:
                    pass

        merged = " ".join(t for t in texts if t).strip()
        return re.sub(r"\s+", " ", merged)
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

    normalized = text.upper()
    normalized = normalized.replace("O", "0").replace("I", "1").replace("L", "1")

    compact = re.sub(r"[^0-9]", " ", normalized)
    raw = re.findall(r"\b\d{8,14}\b", compact)

    # Also consider long digit streams split by spaces/hyphens.
    joined = re.sub(r"[^0-9]", "", normalized)
    if 8 <= len(joined) <= 14:
        raw.append(joined)

    # Longer candidates are usually more likely to be EAN13/UPC.
    uniq = sorted(set(raw), key=lambda x: (-len(x), x))
    return uniq


def analyze_from_image(image_path: str) -> Dict[str, Any]:
    ocr_text = _extract_text_from_image(image_path)

    if not ocr_text:
        return {
            "error": "No readable text found in image. Try a sharper, well-lit photo with barcode or nutrition panel visible.",
            "ocr_text": "",
        }

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
        stop = {"nutrition", "ingredients", "energy", "fat", "salt", "fiber", "sugar", "kcal"}
        tokens = [w for w in words if w.lower() not in stop]
        query = " ".join(tokens[:6] if tokens else words[:6])
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


def _ml_vector(nutriments: Dict[str, float]) -> pd.DataFrame:
    row = {
        "energy_kcal_100g": _safe_float(nutriments.get("energy_kcal")),
        "fat_100g": _safe_float(nutriments.get("fat_100g")),
        "saturated_fat_100g": _safe_float(nutriments.get("saturated_fat_100g")),
        "sugars_100g": _safe_float(nutriments.get("sugar_100g")),
        "salt_100g": _safe_float(nutriments.get("salt_100g")),
        "fiber_100g": _safe_float(nutriments.get("fiber_100g")),
        "proteins_100g": 0.0,
        "additives_n": _safe_float(nutriments.get("additives_count")),
        "nova_group": _safe_float(nutriments.get("nova_group")),
    }
    return pd.DataFrame([row], columns=NUMERIC_FEATURES)


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


def _prob(probs: Dict[str, float], key: str) -> float:
    return float(np.clip(float(probs.get(key, 0.0)), 0.0, 1.0))


def _confidence_from_risk(risk: float) -> float:
    return float(round(min(0.95, 0.55 + abs(risk - 0.5) * 0.8), 3))


def _derive_health_score_from_ml(probs: Dict[str, float]) -> float:
    harmful_keys = [
        "added_sugar",
        "artificial_color",
        "preservative",
        "emulsifier",
        "artificial_flavor",
        "caffeine",
        "palm_oil",
    ]
    beneficial_keys = ["natural_protein_source", "fiber_source"]

    harmful_signal = float(np.mean([_prob(probs, k) for k in harmful_keys])) if harmful_keys else 0.0
    beneficial_signal = (
        float(np.mean([_prob(probs, k) for k in beneficial_keys])) if beneficial_keys else 0.0
    )

    raw = ((1.0 - harmful_signal) * 0.82) + (beneficial_signal * 0.18)
    return round(float(np.clip(raw, 0.0, 1.0) * 100.0), 2)


def _derive_disease_risks_from_ml(probs: Dict[str, float]) -> Dict[str, Dict[str, float]]:
    diabetes = (
        (_prob(probs, "added_sugar") * 0.7)
        + (_prob(probs, "artificial_flavor") * 0.15)
        + (_prob(probs, "emulsifier") * 0.15)
    )
    heart = (
        (_prob(probs, "palm_oil") * 0.4)
        + (_prob(probs, "added_sugar") * 0.25)
        + (_prob(probs, "preservative") * 0.2)
        + (_prob(probs, "emulsifier") * 0.15)
    )
    obesity = (
        (_prob(probs, "added_sugar") * 0.6)
        + (_prob(probs, "palm_oil") * 0.25)
        + (_prob(probs, "artificial_flavor") * 0.15)
    )
    hypertension = (
        (_prob(probs, "preservative") * 0.45)
        + (_prob(probs, "emulsifier") * 0.25)
        + (_prob(probs, "added_sugar") * 0.2)
        + (_prob(probs, "artificial_color") * 0.1)
    )

    risks = {
        "diabetes": float(np.clip(diabetes, 0.0, 1.0)),
        "heart_disease": float(np.clip(heart, 0.0, 1.0)),
        "obesity": float(np.clip(obesity, 0.0, 1.0)),
        "hypertension": float(np.clip(hypertension, 0.0, 1.0)),
    }

    return {
        disease: {
            "risk": round(risk, 3),
            "confidence": _confidence_from_risk(risk),
        }
        for disease, risk in risks.items()
    }


def _derive_processing_level_from_ml(probs: Dict[str, float]) -> Dict[str, str]:
    ultra_signal = (
        (_prob(probs, "artificial_color") * 0.2)
        + (_prob(probs, "preservative") * 0.2)
        + (_prob(probs, "emulsifier") * 0.2)
        + (_prob(probs, "artificial_flavor") * 0.2)
        + (_prob(probs, "palm_oil") * 0.2)
    )
    ultra_signal = float(np.clip(ultra_signal, 0.0, 1.0))

    if ultra_signal >= 0.75:
        group = 4
    elif ultra_signal >= 0.5:
        group = 3
    elif ultra_signal >= 0.25:
        group = 2
    else:
        group = 1

    meta = {
        1: (
            "NOVA 1 — Low Processing Signal",
            "ML indicates low ultra-processing additive patterns.",
            "Generally a cleaner ingredient profile from model perspective.",
        ),
        2: (
            "NOVA 2 — Mild Processing Signal",
            "ML indicates mild processing markers.",
            "Consume normally while checking context and portion size.",
        ),
        3: (
            "NOVA 3 — Processed Pattern",
            "ML indicates multiple processing-related ingredient markers.",
            "Prefer moderate intake and compare with cleaner alternatives.",
        ),
        4: (
            "NOVA 4 — Ultra-Processed Pattern",
            "ML indicates strong ultra-processing additive signatures.",
            "Best consumed occasionally; prefer minimally processed alternatives.",
        ),
    }

    label, description, health_note = meta[group]
    return {
        "nova_group": str(group),
        "label": label,
        "description": description,
        "health_note": health_note,
        "source": "inferred",
    }


def _derive_age_group_impacts_from_ml(disease_risks: Dict[str, Dict[str, float]]) -> Dict[str, Dict[str, str]]:
    avg_risk = float(np.mean([v["risk"] for v in disease_risks.values()])) if disease_risks else 0.0
    risk_map = {
        "infant": min(1.0, avg_risk * 1.15),
        "child": min(1.0, avg_risk * 1.1),
        "young_adult": avg_risk,
        "adult": avg_risk,
        "senior": min(1.0, avg_risk * 1.05),
    }

    def _level(v: float) -> str:
        if v < 0.25:
            return "low"
        if v < 0.5:
            return "moderate"
        if v < 0.75:
            return "high"
        return "very_high"

    labels = {
        "infant": "Infant (0–2 years)",
        "child": "Child (3–12 years)",
        "young_adult": "Young Adult (13–35 years)",
        "adult": "Adult (36–60 years)",
        "senior": "Senior (60+ years)",
    }

    return {
        key: {
            "label": labels[key],
            "risk_level": _level(value),
            "notes": "Estimated from model-predicted ingredient risk profile.",
        }
        for key, value in risk_map.items()
    }


def _derive_consumption_disclaimer_from_ml(health_score: float) -> Dict[str, str]:
    if health_score >= 80:
        freq = "Regular"
        guidance = "Model indicates a relatively safe ingredient profile."
    elif health_score >= 60:
        freq = "Frequent"
        guidance = "Model indicates moderate safety with some caution markers."
    elif health_score >= 40:
        freq = "Occasional"
        guidance = "Model indicates mixed ingredient quality; avoid frequent overconsumption."
    else:
        freq = "Rare"
        guidance = "Model indicates high-risk ingredient patterns."

    return {
        "recommended_frequency": freq,
        "general_guidance": guidance,
        "specific_warnings": "Predictions are probabilistic and should be interpreted with serving context.",
        "disclaimer": "ML-only estimate based on trained ingredient-label models.",
    }


def analyze_product(product: Dict[str, Any]) -> Dict[str, Any]:
    nutriments = product["nutriments"]
    ml_output = ml_predict_flags(nutriments)

    probs = ml_output.get("ml_feature_probabilities", {}) if ml_output.get("model_ready") else {}
    health_score = _derive_health_score_from_ml(probs) if probs else 0.0
    disease_risks = _derive_disease_risks_from_ml(probs) if probs else {}
    processing_level = _derive_processing_level_from_ml(probs) if probs else {
        "nova_group": "unknown",
        "label": "Unknown",
        "description": "ML model artifacts are not available.",
        "health_note": "Train/export models to enable processing-level inference.",
        "source": "unknown",
    }
    age_group_impacts = _derive_age_group_impacts_from_ml(disease_risks) if disease_risks else {}
    consumption_disclaimer = _derive_consumption_disclaimer_from_ml(health_score)

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
