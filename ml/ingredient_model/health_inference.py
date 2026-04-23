import json
import re
from pathlib import Path
from typing import Dict, List

import easyocr
import joblib
import numpy as np
from transformers import pipeline


LABEL_COLUMNS: List[str] = [
    "added_sugar",
    "artificial_color",
    "preservative",
    "emulsifier",
    "artificial_flavor",
    "caffeine",
    "palm_oil",
    "natural_protein_source",
    "fiber_source",
]

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


def _clean_text(text: str) -> str:
    text = (text or "").lower()
    text = re.sub(r"[^a-z0-9,\-\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


class OcrEngine:
    def __init__(self, languages: List[str] | None = None):
        self.reader = easyocr.Reader(languages or ["en"], gpu=False)

    def extract_text(self, image_path: str) -> str:
        blocks = self.reader.readtext(image_path, detail=0)
        return " ".join(blocks)


class BertIngredientExtractor:
    def __init__(self, model_name: str = "dslim/bert-base-NER"):
        self.ner = pipeline("token-classification", model=model_name, aggregation_strategy="simple")

    def extract(self, text: str) -> List[str]:
        entities = self.ner(text)
        # Keep core tokens likely to be ingredient entities from generic NER.
        filtered = [e["word"].lower() for e in entities if e.get("entity_group") in {"MISC", "ORG", "PER"}]
        # Fallback: comma split if NER is sparse.
        if len(filtered) < 3:
            parts = [p.strip() for p in _clean_text(text).split(",") if p.strip()]
            return parts
        return filtered


class IngredientMapper:
    def __init__(self, mapping_path: str):
        with Path(mapping_path).open("r", encoding="utf-8") as f:
            self.mapping = json.load(f)

    def map_flags(self, ingredients: List[str]) -> Dict[str, int]:
        joined = " ".join(ingredients).lower()
        flags: Dict[str, int] = {}
        for label, patterns in self.mapping.items():
            flags[label] = int(any(p.lower() in joined for p in patterns))
        return flags


class RuleBasedEngine:
    # Primary final-risk decision layer.
    def score(self, nutriments: Dict[str, float], mapped_flags: Dict[str, int]) -> Dict[str, float | str]:
        sugar = float(nutriments.get("sugars_100g", 0.0))
        fat = float(nutriments.get("fat_100g", 0.0))
        salt = float(nutriments.get("salt_100g", 0.0))
        fiber = float(nutriments.get("fiber_100g", 0.0))
        additives = float(nutriments.get("additives_n", 0.0))
        nova = float(nutriments.get("nova_group", 0.0))

        risk_points = 0.0
        risk_points += min(max((sugar - 5.0) / 17.5, 0.0), 1.0) * 35.0
        risk_points += min(max((fat - 3.0) / 14.5, 0.0), 1.0) * 20.0
        risk_points += min(max((salt - 0.3) / 1.2, 0.0), 1.0) * 20.0
        risk_points += min(additives / 8.0, 1.0) * 10.0
        risk_points += (30.0 if int(nova) == 4 else 10.0 if int(nova) == 3 else 0.0)
        risk_points -= min(fiber / 6.0, 1.0) * 15.0

        # Add a small penalty when ingredient red-flag features are present.
        risk_points += sum(mapped_flags.values()) * 1.8

        risk_points = float(np.clip(risk_points, 0.0, 100.0))
        if risk_points < 25:
            label = "low"
        elif risk_points < 50:
            label = "moderate"
        elif risk_points < 75:
            label = "high"
        else:
            label = "very_high"

        return {
            "rule_risk_score": round(risk_points, 2),
            "rule_risk_label": label,
        }


class MLEnhancer:
    # Secondary enhancement layer over the rule engine.
    def __init__(self, rf_model_path: str, xgb_model_path: str):
        self.rf_bundle = joblib.load(rf_model_path)
        self.xgb_bundle = joblib.load(xgb_model_path)
        self.feature_columns = self.rf_bundle.get("feature_columns", NUMERIC_FEATURES)
        self.label_columns = self.rf_bundle.get("label_columns", LABEL_COLUMNS)

    def _vectorize(self, nutriments: Dict[str, float]) -> np.ndarray:
        row = [float(nutriments.get(k, 0.0)) for k in self.feature_columns]
        return np.array(row, dtype=np.float32).reshape(1, -1)

    @staticmethod
    def _model_prob_to_vector(prob_outputs: List[np.ndarray]) -> np.ndarray:
        return np.array([p[:, 1] if p.shape[1] > 1 else p[:, 0] for p in prob_outputs]).reshape(-1)

    def predict_feature_probabilities(self, nutriments: Dict[str, float]) -> Dict[str, float]:
        x = self._vectorize(nutriments)

        rf_model = self.rf_bundle["model"]
        labels = self.label_columns

        rf_probs = self._model_prob_to_vector(rf_model.predict_proba(x))

        if self.xgb_bundle.get("mode") == "per_label":
            xgb_models = self.xgb_bundle["models"]
            xgb_vec = []
            for label in labels:
                probs = xgb_models[label].predict_proba(x)
                xgb_vec.append(probs[:, 1] if probs.shape[1] > 1 else probs[:, 0])
            xgb_probs = np.array(xgb_vec).reshape(-1)
        else:
            xgb_model = self.xgb_bundle["model"]
            xgb_probs = self._model_prob_to_vector(xgb_model.predict_proba(x))

        ensemble = (rf_probs + xgb_probs) / 2.0
        return {labels[i]: float(np.clip(ensemble[i], 0.0, 1.0)) for i in range(len(labels))}


class HealthRiskPipeline:
    def __init__(
        self,
        mapping_path: str,
        rf_model_path: str,
        xgb_model_path: str,
    ):
        self.ocr = OcrEngine()
        self.bert = BertIngredientExtractor()
        self.mapper = IngredientMapper(mapping_path=mapping_path)
        self.rules = RuleBasedEngine()
        self.ml = MLEnhancer(rf_model_path=rf_model_path, xgb_model_path=xgb_model_path)

    def run(self, image_path: str, nutriments: Dict[str, float]) -> Dict:
        text = self.ocr.extract_text(image_path)
        ingredients = self.bert.extract(text)
        mapped_flags = self.mapper.map_flags(ingredients)

        rule_result = self.rules.score(nutriments=nutriments, mapped_flags=mapped_flags)
        ml_feature_probs = self.ml.predict_feature_probabilities(nutriments=nutriments)

        # Blend rule-based risk with ML confidence from learned feature probabilities.
        ml_signal = float(np.mean(list(ml_feature_probs.values()))) * 100.0
        final_score = 0.7 * float(rule_result["rule_risk_score"]) + 0.3 * ml_signal
        final_score = float(np.clip(final_score, 0.0, 100.0))

        if final_score < 25:
            final_label = "low"
        elif final_score < 50:
            final_label = "moderate"
        elif final_score < 75:
            final_label = "high"
        else:
            final_label = "very_high"

        return {
            "ocr_text": text,
            "extracted_ingredients": ingredients,
            "mapped_feature_flags": mapped_flags,
            "rule_based": rule_result,
            "ml_feature_probabilities": ml_feature_probs,
            "final_health_risk": {
                "score": round(final_score, 2),
                "label": final_label,
            },
        }
