## NutriScan AI Backend

Backend + ML pipeline for analyzing packaged foods by barcode and providing health insights.

This project is **backend-only** so you can later connect any web/mobile frontend to it.

### Project Structure (initial)

- **backend/**
  - **app.py** – FastAPI app factory and `app` instance.
  - **config.py** – Environment / settings management using `pydantic-settings`.
  - **routes/**
    - **\_\_init\_\_.py** – Route package marker + docs.
    - **scan.py** – Example `/api/scan-product` endpoint that accepts a barcode and returns stubbed product data.
  - **models/**
    - **\_\_init\_\_.py** – Models package marker.
    - **schemas.py** – Pydantic request/response schemas (e.g., `ScanRequest`, `ProductDetails`).
  - **utils/**
    - **\_\_init\_\_.py** – Placeholder for shared utilities.
- **requirements.txt** – Python dependencies with versions.
- **.env.example** – Example environment configuration (copy to `.env` and edit).

Later we will add:

- `services/` for OpenFoodFacts, ML models, LLM/RAG logic.
- `ml/` and `rag/` directories as per your full spec.

### Setup & Running the Server

1. **Create and activate a virtual environment (Windows / PowerShell)**

```powershell
cd "c:\Users\Shikhar\OneDrive\Desktop\Documents\FreshCheck\nutriscan-ai"
python -m venv .venv
.venv\Scripts\Activate.ps1
```

2. **Install dependencies**

```powershell
pip install --upgrade pip
pip install -r requirements.txt
```

3. **Create your `.env` file**

Copy the example and fill in real values:

```powershell
copy .env.example .env
```

Then edit `.env` (e.g., set `GEMINI_API_KEY`).

4. **Run the FastAPI server**

From the project root (`nutriscan-ai`):

```powershell
uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

5. **Test the API**

- Open interactive docs in your browser: `http://localhost:8000/docs`
- Try:
  - `GET /health` – basic health check.
  - `POST /api/scan-product` with JSON body: `{ "barcode": "1234567890123" }`

This skeleton is designed so that **all ML and RAG logic** will live in dedicated `services/` and `ml/` modules, making it easy to connect any frontend later.

## ML-First Pipeline (Open Food Facts + RF + XGBoost)

The project now includes an end-to-end ML pipeline under `ml/ingredient_model`:

1. Image Input
2. OCR with EasyOCR
3. Text Cleaning
4. BERT-based Ingredient Extraction
5. Ingredient Mapping DB
6. Rule-Based Engine (Primary)
7. ML Enhancement using Random Forest + XGBoost
8. Final Health Risk Output

### Files

- `ml/ingredient_model/off_pipeline.py`
  - Downloads product data from Open Food Facts.
  - Builds engineered dataset with all numeric nutrition features + ingredient feature labels.
  - Trains both Random Forest and XGBoost feature models.

- `ml/ingredient_model/ingredient_mapping_db.json`
  - Ingredient keyword mapping database for feature flags.

- `ml/ingredient_model/health_inference.py`
  - OCR + BERT + mapping + rule engine + ML enhancement inference flow.

- `ml/ingredient_model/run_health_pipeline.py`
  - CLI entrypoint to run inference on an image.

### Train Models from Open Food Facts

From project root:

```powershell
python -m ml.ingredient_model.off_pipeline --dataset-out ml/data/openfoodfacts_features.csv --models-out ml/saved_models --page-size 250 --page-limit 20
```

For stronger accuracy tuning, increase search depth and CV folds:

```powershell
python -m ml.ingredient_model.off_pipeline --dataset-out ml/data/openfoodfacts_features.csv --models-out ml/saved_models --page-size 250 --page-limit 40 --rf-search-iter 45 --rf-cv 5
```

This saves:

- `ml/data/openfoodfacts_features.csv`
- `ml/saved_models/rf_feature_model.joblib`
- `ml/saved_models/xgb_feature_model.joblib`
- `ml/saved_models/training_metrics.json`

Quality controls built into training:

- Train/validation/test split (not just train/test) for stronger generalization checks.
- Random Forest hyperparameter search (`RandomizedSearchCV`) to improve accuracy.
- XGBoost per-label training with early stopping on validation data.
- Per-label decision-threshold tuning on validation data to maximize F1.
- Overfit/underfit diagnostics in `training_metrics.json` using train-vs-val gap and low-score checks.

### Run Full OCR to Risk Inference

Create a nutriments JSON file (example):

```json
{
  "energy_kcal_100g": 420,
  "fat_100g": 17,
  "saturated_fat_100g": 6,
  "sugars_100g": 21,
  "salt_100g": 1.1,
  "fiber_100g": 2.5,
  "proteins_100g": 5.2,
  "additives_n": 4,
  "nova_group": 4
}
```

Run:

```powershell
python -m ml.ingredient_model.run_health_pipeline --image path\to\label.jpg --nutriments-json path\to\nutriments.json
```

