import argparse
import json
from pathlib import Path

from .health_inference import HealthRiskPipeline


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run OCR + BERT + ingredient mapping + rule engine + RF/XGBoost enhancement."
    )
    parser.add_argument("--image", required=True, help="Path to food label image.")
    parser.add_argument(
        "--nutriments-json",
        required=True,
        help="Path to JSON containing numeric nutriments (per 100g).",
    )
    parser.add_argument(
        "--mapping",
        default="ml/ingredient_model/ingredient_mapping_db.json",
        help="Ingredient mapping DB JSON path.",
    )
    parser.add_argument(
        "--rf-model",
        default="ml/saved_models/rf_feature_model.joblib",
        help="Random Forest model path.",
    )
    parser.add_argument(
        "--xgb-model",
        default="ml/saved_models/xgb_feature_model.joblib",
        help="XGBoost model path.",
    )
    args = parser.parse_args()

    nutriments = json.loads(Path(args.nutriments_json).read_text(encoding="utf-8"))

    pipeline = HealthRiskPipeline(
        mapping_path=args.mapping,
        rf_model_path=args.rf_model,
        xgb_model_path=args.xgb_model,
    )
    result = pipeline.run(image_path=args.image, nutriments=nutriments)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
