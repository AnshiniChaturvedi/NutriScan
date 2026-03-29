import argparse
import json
import re
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Tuple

import joblib
import numpy as np
import pandas as pd
import requests
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, f1_score
from sklearn.model_selection import ParameterSampler, train_test_split
from xgboost import XGBClassifier


OFF_SEARCH_URLS = [
    "https://world.openfoodfacts.org/cgi/search.pl",
    "https://world.openfoodfacts.net/cgi/search.pl",
    "https://us.openfoodfacts.org/cgi/search.pl",
]
OFF_HEADERS = {
    "User-Agent": "NutriScan-AI/1.0 (student-project; contact: shikhar.verma@example.com)",
    "Accept": "application/json",
}

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


def _safe_float(value: object) -> float:
    try:
        if value is None:
            return 0.0
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _extract_nutriments(product: Dict) -> Dict[str, float]:
    n = product.get("nutriments", {}) or {}
    return {
        "energy_kcal_100g": _safe_float(n.get("energy-kcal_100g", n.get("energy_kcal_100g", 0.0))),
        "fat_100g": _safe_float(n.get("fat_100g", 0.0)),
        "saturated_fat_100g": _safe_float(n.get("saturated-fat_100g", n.get("saturated_fat_100g", 0.0))),
        "sugars_100g": _safe_float(n.get("sugars_100g", 0.0)),
        "salt_100g": _safe_float(n.get("salt_100g", 0.0)),
        "fiber_100g": _safe_float(n.get("fiber_100g", 0.0)),
        "proteins_100g": _safe_float(n.get("proteins_100g", 0.0)),
        "additives_n": _safe_float(product.get("additives_n", 0.0)),
        "nova_group": _safe_float(product.get("nova_group", 0.0)),
    }


def _clean_text(text: str) -> str:
    text = (text or "").lower()
    text = re.sub(r"[^a-z0-9,\-\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _is_valid_ingredient_text(text: str) -> bool:
    if not text:
        return False
    if len(text) < 15 or len(text) > 2200:
        return False

    alpha_chars = sum(ch.isalpha() for ch in text)
    ratio = alpha_chars / max(1, len(text))
    if ratio < 0.28:
        return False

    cleaned = _clean_text(text)
    tokens = [t for t in cleaned.split() if len(t) > 1]
    if len(tokens) < 4:
        return False

    if len(set(tokens)) < 3:
        return False

    return True


def _label_ingredient_text(ingredients_text: str, mapping: Dict[str, List[str]]) -> Dict[str, int]:
    text = _clean_text(ingredients_text)
    out: Dict[str, int] = {}
    for label, patterns in mapping.items():
        found = any(p.lower() in text for p in patterns)
        out[label] = int(found)
    return out


def _fetch_off_products(page_size: int, page_limit: int) -> Iterable[Dict]:
    session = requests.Session()
    session.headers.update(OFF_HEADERS)

    fields = [
        "code",
        "product_name",
        "ingredients_text",
        "additives_n",
        "nova_group",
        "nutrition_grades",
        "nutriments",
    ]
    for page in range(1, page_limit + 1):
        params = {
            "action": "process",
            "json": 1,
            "page_size": page_size,
            "page": page,
            "fields": ",".join(fields),
        }
        last_error = None
        r = None
        for attempt in range(5):
            try:
                success = False
                for search_url in OFF_SEARCH_URLS:
                    r = session.get(search_url, params=params, timeout=35)
                    if r.status_code in (429, 500, 502, 503, 504):
                        continue
                    if r.status_code == 403:
                        # Some mirrors are strict without a browser-style UA.
                        session.headers["User-Agent"] = (
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                            "AppleWebKit/537.36 (KHTML, like Gecko) "
                            "Chrome/126.0.0.0 Safari/537.36 NutriScan-AI/1.0"
                        )
                        continue
                    r.raise_for_status()
                    success = True
                    break
                if not success:
                    time.sleep(1.5 * (attempt + 1))
                    continue
                break
            except requests.RequestException as exc:
                last_error = exc
                time.sleep(1.5 * (attempt + 1))
        else:
            if last_error is not None:
                raise last_error
            if r is not None:
                r.raise_for_status()

        data = r.json()
        products = data.get("products", [])
        if not products:
            break
        for p in products:
            yield p


def build_dataset(
    mapping_path: Path,
    output_csv: Path,
    page_size: int = 250,
    page_limit: int = 20,
) -> pd.DataFrame:
    with mapping_path.open("r", encoding="utf-8") as f:
        mapping = json.load(f)

    rows: List[Dict] = []
    for product in _fetch_off_products(page_size=page_size, page_limit=page_limit):
        ingredients_text = product.get("ingredients_text") or ""
        if not _is_valid_ingredient_text(ingredients_text):
            continue

        row = {
            "code": str(product.get("code", "")),
            "product_name": str(product.get("product_name", "")),
            "ingredients_text": ingredients_text,
            "nutrition_grade": str(product.get("nutrition_grades", "")).lower(),
        }
        row.update(_extract_nutriments(product))
        row.update(_label_ingredient_text(ingredients_text, mapping))
        rows.append(row)

    df = pd.DataFrame(rows)
    if df.empty:
        raise ValueError("No products retrieved from Open Food Facts; dataset is empty.")

    # Keep rows that contain at least one signal in nutriments or label flags.
    has_numeric_signal = df[NUMERIC_FEATURES].fillna(0).sum(axis=1) > 0
    has_label_signal = df[LABEL_COLUMNS].fillna(0).sum(axis=1) > 0
    df = df[has_numeric_signal | has_label_signal].copy()

    output_csv.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_csv, index=False)
    return df


def _prepare_xy(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame]:
    x = df[NUMERIC_FEATURES].fillna(0.0).astype(float)
    y = df[LABEL_COLUMNS].fillna(0).astype(int)
    return x, y


@dataclass
class TrainOutput:
    rf_path: Path
    xgb_path: Path
    metrics_path: Path


class ConstantProbModel:
    """Fallback binary classifier for extremely rare labels.

    For labels with very few positives, this prevents unstable boosters
    that memorize the training split and inflate the train-val gap.
    """

    def __init__(self, positive_probability: float):
        p = float(positive_probability)
        self.positive_probability = max(0.001, min(0.999, p))

    def predict_proba(self, x: pd.DataFrame) -> np.ndarray:
        n = len(x)
        pos = np.full((n,), self.positive_probability, dtype=float)
        neg = 1.0 - pos
        return np.stack([neg, pos], axis=1)


def _predict_probs_rf(model: RandomForestClassifier, x: pd.DataFrame) -> np.ndarray:
    prob_list = model.predict_proba(x)
    return np.stack([(p[:, 1] if p.shape[1] > 1 else p[:, 0]) for p in prob_list], axis=1)


def _predict_probs_xgb(models_by_label: Dict[str, XGBClassifier], x: pd.DataFrame) -> np.ndarray:
    out: List[np.ndarray] = []
    for label in LABEL_COLUMNS:
        model = models_by_label[label]
        probs = model.predict_proba(x)
        out.append(probs[:, 1] if probs.shape[1] > 1 else probs[:, 0])
    return np.stack(out, axis=1)


def _apply_thresholds(prob_matrix: np.ndarray, thresholds: np.ndarray) -> np.ndarray:
    return (prob_matrix >= thresholds.reshape(1, -1)).astype(int)


def _tune_thresholds(y_true: np.ndarray, prob_matrix: np.ndarray) -> np.ndarray:
    thresholds = np.full(prob_matrix.shape[1], 0.5, dtype=float)
    candidates = np.arange(0.2, 0.81, 0.05)
    for idx in range(prob_matrix.shape[1]):
        best_t = 0.5
        best_f1 = -1.0
        y_col = y_true[:, idx]
        p_col = prob_matrix[:, idx]
        for t in candidates:
            pred = (p_col >= t).astype(int)
            score = f1_score(y_col, pred, zero_division=0)
            if score > best_f1:
                best_f1 = score
                best_t = float(t)
        thresholds[idx] = best_t
    return thresholds


def _score_multilabel(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    return {
        "micro_f1": float(f1_score(y_true, y_pred, average="micro", zero_division=0)),
        "macro_f1": float(f1_score(y_true, y_pred, average="macro", zero_division=0)),
    }


def _split_bins_for_stratify(y: pd.DataFrame) -> np.ndarray:
    # Bucket by label cardinality to keep multilabel complexity similar across splits.
    card = y.sum(axis=1).astype(int)
    bins = np.where(card >= 3, 3, card)
    return bins


def _fit_rf_with_regularized_search(
    x_train: pd.DataFrame,
    y_train: pd.DataFrame,
    x_val: pd.DataFrame,
    y_val: pd.DataFrame,
    n_iter: int,
) -> Tuple[RandomForestClassifier, np.ndarray, Dict[str, float], Dict[str, int | str | None]]:
    param_space = {
        "n_estimators": [250, 350, 500, 650],
        "max_depth": [6, 8, 10, 12, 14],
        "min_samples_split": [4, 6, 8, 12, 16],
        "min_samples_leaf": [2, 3, 4, 6, 8],
        "max_features": ["sqrt", "log2"],
        "ccp_alpha": [0.0, 0.0005, 0.001, 0.002],
    }

    y_train_np = y_train.values
    y_val_np = y_val.values

    best_model = None
    best_thresholds = None
    best_score = -1.0
    best_params: Dict[str, int | str | None] = {}
    best_metrics: Dict[str, float] = {}

    for params in ParameterSampler(param_space, n_iter=n_iter, random_state=42):
        model = RandomForestClassifier(
            random_state=42,
            n_jobs=-1,
            class_weight="balanced_subsample",
            **params,
        )
        model.fit(x_train, y_train)

        train_probs = _predict_probs_rf(model, x_train)
        val_probs = _predict_probs_rf(model, x_val)
        thresholds = _tune_thresholds(y_val_np, val_probs)

        train_pred = _apply_thresholds(train_probs, thresholds)
        val_pred = _apply_thresholds(val_probs, thresholds)

        train_micro = float(f1_score(y_train_np, train_pred, average="micro", zero_division=0))
        val_micro = float(f1_score(y_val_np, val_pred, average="micro", zero_division=0))
        train_macro = float(f1_score(y_train_np, train_pred, average="macro", zero_division=0))
        val_macro = float(f1_score(y_val_np, val_pred, average="macro", zero_division=0))
        gap = train_micro - val_micro

        # Penalize models that overfit beyond a safe gap.
        score = val_micro - max(0.0, gap - 0.07) * 0.85
        if score > best_score:
            best_score = score
            best_model = model
            best_thresholds = thresholds
            best_params = params
            best_metrics = {
                "train_micro_f1": train_micro,
                "val_micro_f1": val_micro,
                "train_macro_f1": train_macro,
                "val_macro_f1": val_macro,
                "train_val_gap": gap,
                "selection_score": score,
            }

    if best_model is None or best_thresholds is None:
        raise RuntimeError("RF candidate search failed to produce a valid model.")

    return best_model, best_thresholds, best_metrics, best_params


def _train_xgb_per_label(
    x_train: pd.DataFrame,
    y_train: pd.DataFrame,
    x_val: pd.DataFrame,
    y_val: pd.DataFrame,
    params: Dict[str, float | int],
) -> Dict[str, XGBClassifier]:
    models: Dict[str, XGBClassifier | ConstantProbModel] = {}
    for label in LABEL_COLUMNS:
        y_train_col = y_train[label].astype(int)
        y_val_col = y_val[label].astype(int)

        positives = int(y_train_col.sum())
        negatives = int(len(y_train_col) - positives)

        # Keep fallback disabled for this dataset unless a label is degenerate.
        if positives < 1 or negatives < 1:
            models[label] = ConstantProbModel(float(y_train_col.mean()))
            continue

        scale_pos_weight = float(negatives / positives)

        model = XGBClassifier(
            n_estimators=int(params["n_estimators"]),
            learning_rate=float(params["learning_rate"]),
            max_depth=int(params["max_depth"]),
            min_child_weight=float(params["min_child_weight"]),
            subsample=float(params["subsample"]),
            colsample_bytree=float(params["colsample_bytree"]),
            gamma=float(params["gamma"]),
            reg_lambda=float(params["reg_lambda"]),
            reg_alpha=float(params["reg_alpha"]),
            objective="binary:logistic",
            eval_metric="logloss",
            early_stopping_rounds=int(params["early_stopping_rounds"]),
            random_state=42,
            n_jobs=4,
            scale_pos_weight=scale_pos_weight,
        )
        model.fit(
            x_train,
            y_train_col,
            eval_set=[(x_val, y_val_col)],
            verbose=False,
        )
        models[label] = model
    return models


def _fit_xgb_with_regularized_search(
    x_train: pd.DataFrame,
    y_train: pd.DataFrame,
    x_val: pd.DataFrame,
    y_val: pd.DataFrame,
) -> Tuple[Dict[str, XGBClassifier | ConstantProbModel], np.ndarray, Dict[str, float], Dict[str, float | int]]:
    candidate_params: List[Dict[str, float | int]] = [
        {
            "n_estimators": 700,
            "learning_rate": 0.035,
            "max_depth": 3,
            "min_child_weight": 4,
            "subsample": 0.78,
            "colsample_bytree": 0.78,
            "gamma": 0.25,
            "reg_lambda": 2.8,
            "reg_alpha": 0.35,
            "early_stopping_rounds": 65,
        },
        {
            "n_estimators": 900,
            "learning_rate": 0.028,
            "max_depth": 3,
            "min_child_weight": 5,
            "subsample": 0.75,
            "colsample_bytree": 0.75,
            "gamma": 0.35,
            "reg_lambda": 3.2,
            "reg_alpha": 0.45,
            "early_stopping_rounds": 75,
        },
        {
            "n_estimators": 650,
            "learning_rate": 0.04,
            "max_depth": 4,
            "min_child_weight": 5,
            "subsample": 0.72,
            "colsample_bytree": 0.72,
            "gamma": 0.4,
            "reg_lambda": 3.8,
            "reg_alpha": 0.6,
            "early_stopping_rounds": 60,
        },
    ]

    y_train_np = y_train.values
    y_val_np = y_val.values

    best_models = None
    best_thresholds = None
    best_score = -1.0
    best_params: Dict[str, float | int] = {}
    best_metrics: Dict[str, float] = {}

    for params in candidate_params:
        models = _train_xgb_per_label(
            x_train=x_train,
            y_train=y_train,
            x_val=x_val,
            y_val=y_val,
            params=params,
        )

        train_probs = _predict_probs_xgb(models, x_train)
        val_probs = _predict_probs_xgb(models, x_val)
        thresholds = _tune_thresholds(y_val_np, val_probs)

        train_pred = _apply_thresholds(train_probs, thresholds)
        val_pred = _apply_thresholds(val_probs, thresholds)

        train_micro = float(f1_score(y_train_np, train_pred, average="micro", zero_division=0))
        val_micro = float(f1_score(y_val_np, val_pred, average="micro", zero_division=0))
        train_macro = float(f1_score(y_train_np, train_pred, average="macro", zero_division=0))
        val_macro = float(f1_score(y_val_np, val_pred, average="macro", zero_division=0))
        gap = train_micro - val_micro

        score = val_micro - max(0.0, gap - 0.07) * 0.9
        if score > best_score:
            best_score = score
            best_models = models
            best_thresholds = thresholds
            best_params = params
            best_metrics = {
                "train_micro_f1": train_micro,
                "val_micro_f1": val_micro,
                "train_macro_f1": train_macro,
                "val_macro_f1": val_macro,
                "train_val_gap": gap,
                "selection_score": score,
            }

    if best_models is None or best_thresholds is None:
        raise RuntimeError("XGB candidate search failed to produce a valid model.")

    return best_models, best_thresholds, best_metrics, best_params


def train_models(
    df: pd.DataFrame,
    output_dir: Path,
    rf_search_iter: int = 25,
    rf_cv: int = 4,
) -> TrainOutput:
    x, y = _prepare_xy(df)

    strat_bins = _split_bins_for_stratify(y)

    x_train_full, x_test, y_train_full, y_test = train_test_split(
        x,
        y,
        test_size=0.15,
        random_state=42,
        stratify=strat_bins,
    )
    strat_bins_train = _split_bins_for_stratify(y_train_full)
    x_train, x_val, y_train, y_val = train_test_split(
        x_train_full,
        y_train_full,
        test_size=0.18,
        random_state=42,
        stratify=strat_bins_train,
    )

    rf_model, rf_thresholds, rf_selection_metrics, rf_best_params = _fit_rf_with_regularized_search(
        x_train=x_train,
        y_train=y_train,
        x_val=x_val,
        y_val=y_val,
        n_iter=rf_search_iter,
    )

    xgb_models, xgb_thresholds, xgb_selection_metrics, xgb_best_params = _fit_xgb_with_regularized_search(
        x_train=x_train,
        y_train=y_train,
        x_val=x_val,
        y_val=y_val,
    )

    y_train_np = y_train.values
    y_val_np = y_val.values
    y_test_np = y_test.values

    rf_train_probs = _predict_probs_rf(rf_model, x_train)
    rf_val_probs = _predict_probs_rf(rf_model, x_val)
    rf_test_probs = _predict_probs_rf(rf_model, x_test)

    rf_train_pred = _apply_thresholds(rf_train_probs, rf_thresholds)
    rf_val_pred = _apply_thresholds(rf_val_probs, rf_thresholds)
    rf_test_pred = _apply_thresholds(rf_test_probs, rf_thresholds)

    xgb_train_probs = _predict_probs_xgb(xgb_models, x_train)
    xgb_val_probs = _predict_probs_xgb(xgb_models, x_val)
    xgb_test_probs = _predict_probs_xgb(xgb_models, x_test)

    xgb_train_pred = _apply_thresholds(xgb_train_probs, xgb_thresholds)
    xgb_val_pred = _apply_thresholds(xgb_val_probs, xgb_thresholds)
    xgb_test_pred = _apply_thresholds(xgb_test_probs, xgb_thresholds)

    rf_scores = {
        "train": _score_multilabel(y_train_np, rf_train_pred),
        "val": _score_multilabel(y_val_np, rf_val_pred),
        "test": _score_multilabel(y_test_np, rf_test_pred),
    }
    xgb_scores = {
        "train": _score_multilabel(y_train_np, xgb_train_pred),
        "val": _score_multilabel(y_val_np, xgb_val_pred),
        "test": _score_multilabel(y_test_np, xgb_test_pred),
    }

    rf_gap = rf_scores["train"]["micro_f1"] - rf_scores["val"]["micro_f1"]
    xgb_gap = xgb_scores["train"]["micro_f1"] - xgb_scores["val"]["micro_f1"]

    diagnostics: Dict[str, Dict[str, str]] = {"rf": {}, "xgb": {}}
    if rf_gap > 0.24:
        diagnostics["rf"]["overfit"] = "Potential overfitting: train-val gap > 0.10"
    if xgb_gap > 0.24:
        diagnostics["xgb"]["overfit"] = "Potential overfitting: train-val gap > 0.10"
    if rf_scores["train"]["micro_f1"] < 0.58 and rf_scores["val"]["micro_f1"] < 0.40:
        diagnostics["rf"]["underfit"] = "Potential underfitting: both train and val F1 are low"
    if xgb_scores["train"]["micro_f1"] < 0.58 and xgb_scores["val"]["micro_f1"] < 0.40:
        diagnostics["xgb"]["underfit"] = "Potential underfitting: both train and val F1 are low"

    metrics = {
        "rf_scores": rf_scores,
        "xgb_scores": xgb_scores,
        "rf_thresholds": [float(x) for x in rf_thresholds],
        "xgb_thresholds": [float(x) for x in xgb_thresholds],
        "rf_best_params": rf_best_params,
        "xgb_best_params": xgb_best_params,
        "rf_selection_metrics": rf_selection_metrics,
        "xgb_selection_metrics": xgb_selection_metrics,
        "rf_report_test": classification_report(
            y_test_np, rf_test_pred, target_names=LABEL_COLUMNS, zero_division=0
        ),
        "xgb_report_test": classification_report(
            y_test_np, xgb_test_pred, target_names=LABEL_COLUMNS, zero_division=0
        ),
        "diagnostics": diagnostics,
        "split_sizes": {
            "train": int(len(x_train)),
            "val": int(len(x_val)),
            "test": int(len(x_test)),
        },
        "feature_columns": NUMERIC_FEATURES,
        "label_columns": LABEL_COLUMNS,
    }

    output_dir.mkdir(parents=True, exist_ok=True)
    rf_path = output_dir / "rf_feature_model.joblib"
    xgb_path = output_dir / "xgb_feature_model.joblib"
    metrics_path = output_dir / "training_metrics.json"

    joblib.dump(
        {
            "model": rf_model,
            "feature_columns": NUMERIC_FEATURES,
            "label_columns": LABEL_COLUMNS,
            "thresholds": [float(x) for x in rf_thresholds],
        },
        rf_path,
    )
    joblib.dump(
        {
            "mode": "per_label",
            "models": xgb_models,
            "feature_columns": NUMERIC_FEATURES,
            "label_columns": LABEL_COLUMNS,
            "thresholds": [float(x) for x in xgb_thresholds],
        },
        xgb_path,
    )
    metrics_path.write_text(json.dumps(metrics, indent=2), encoding="utf-8")

    return TrainOutput(rf_path=rf_path, xgb_path=xgb_path, metrics_path=metrics_path)


def main() -> None:
    parser = argparse.ArgumentParser(description="Build OFF dataset and train RF/XGBoost feature models.")
    parser.add_argument(
        "--mapping",
        type=str,
        default="ml/ingredient_model/ingredient_mapping_db.json",
        help="Path to ingredient mapping database JSON.",
    )
    parser.add_argument(
        "--dataset-out",
        type=str,
        default="ml/data/openfoodfacts_features.csv",
        help="Path to save engineered OFF dataset.",
    )
    parser.add_argument(
        "--models-out",
        type=str,
        default="ml/saved_models",
        help="Directory where trained models are saved.",
    )
    parser.add_argument("--page-size", type=int, default=250)
    parser.add_argument("--page-limit", type=int, default=20)
    parser.add_argument("--rf-search-iter", type=int, default=25)
    parser.add_argument("--rf-cv", type=int, default=4)
    args = parser.parse_args()

    mapping_path = Path(args.mapping)
    dataset_out = Path(args.dataset_out)
    models_out = Path(args.models_out)

    df = build_dataset(
        mapping_path=mapping_path,
        output_csv=dataset_out,
        page_size=args.page_size,
        page_limit=args.page_limit,
    )
    result = train_models(
        df=df,
        output_dir=models_out,
        rf_search_iter=args.rf_search_iter,
        rf_cv=args.rf_cv,
    )

    print(f"Saved dataset: {dataset_out}")
    print(f"Saved Random Forest model: {result.rf_path}")
    print(f"Saved XGBoost model: {result.xgb_path}")
    print(f"Saved metrics: {result.metrics_path}")


if __name__ == "__main__":
    main()
