# NutriScan AI

An AI-powered food intelligence platform that analyzes packaged products from barcode, product name, or image upload and returns nutrition and ingredient-based risk insights.

NutriScan combines:
- Open Food Facts product retrieval
- OCR-powered label reading
- Multi-label ML inference (Random Forest + XGBoost ensemble)
- Next.js dashboard experience with scan, upload, recommendations, and chat

---

## Why NutriScan

Most nutrition apps only show raw numbers. NutriScan focuses on practical interpretation:
- Is this product likely to contain high-risk ingredient traits?
- How strong is that prediction?
- What healthier alternatives exist?

---

## Core Features

- Barcode scanning from camera
- Product-name lookup fallback
- Image upload analysis with OCR + barcode/text extraction
- ML-only ingredient risk predictions using your trained models
- Product dashboard with score, risk panels, and recommendations
- Chat assistant with product context

---

## Tech Stack

### Frontend
- Next.js 14
- React 18
- Tailwind CSS
- Framer Motion
- Three.js / React Three Fiber

### ML + Data
- Python 3.13
- scikit-learn
- XGBoost
- EasyOCR
- PyTorch / Transformers
- Open Food Facts API

---

## Project Structure

```text
nutriscan-ai/
  backend/
    app.py
    services/
  frontend/
    src/app/
    src/components/
    src/lib/
  ml/
    data/
    ingredient_model/
    saved_models/
  start-dev.bat
  requirements.txt
```

---

## How The Pipeline Works

1. Input source
   - Barcode scan
   - Product name
   - Uploaded image

2. Retrieval and extraction
   - Open Food Facts product fetch/search
   - OCR text extraction for images
   - Barcode candidate extraction from OCR text

3. ML inference
   - Feature vector created from nutriments
   - Random Forest and XGBoost probabilities computed per label
   - Ensemble average + tuned thresholds for final flags

4. Response to UI
   - `ml_feature_probabilities`
   - `ml_flags`
   - Derived dashboard fields for visualization

---

## Quick Start (Windows)

### 1) Clone

```powershell
git clone https://github.com/Shikhar28-web/NutriScan.git
cd NutriScan\nutriscan-ai
```

### 2) Python setup

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
```

### 3) Frontend setup

```powershell
cd frontend
npm install
cd ..
```

### 4) Run project (recommended)

```powershell
& "c:\Users\Shikhar\OneDrive\Desktop\sem4_projects\NutriScan\nutriscan-ai\start-dev.bat"
```

App runs at:
- http://localhost:3000

---

## Cross-Platform Run (Manual)

Use this if you do not want to rely on the Windows batch script.

### Windows PowerShell

```powershell
cd nutriscan-ai
$env:PYTHON_BIN = "c:/Users/Shikhar/OneDrive/Desktop/sem4_projects/NutriScan/.venv/Scripts/python.exe"
cd frontend
npm run dev
```

### macOS / Linux

```bash
cd nutriscan-ai
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd frontend
npm install
PYTHON_BIN="$(pwd)/../.venv/bin/python3" npm run dev
```

---

## Model Training

Train dataset + models from Open Food Facts:

```powershell
python -m ml.ingredient_model.off_pipeline --dataset-out ml/data/openfoodfacts_features.csv --models-out ml/saved_models --page-size 250 --page-limit 20
```

Higher search depth (slower, usually better):

```powershell
python -m ml.ingredient_model.off_pipeline --dataset-out ml/data/openfoodfacts_features.csv --models-out ml/saved_models --page-size 250 --page-limit 40 --rf-search-iter 45 --rf-cv 5
```

Artifacts produced:
- `ml/data/openfoodfacts_features.csv`
- `ml/saved_models/rf_feature_model.joblib`
- `ml/saved_models/xgb_feature_model.joblib`
- `ml/saved_models/training_metrics.json`

---

## Image Upload Notes

Supported upload formats:
- JPEG
- PNG
- WEBP
- BMP

Best OCR results:
- Keep barcode/text in focus
- Use good lighting
- Avoid motion blur
- Fill most of frame with label/barcode

---

## Troubleshooting

### Port 3000 already in use

Stop existing process or run frontend on another port.

### Batch file not found

Run from project folder or use absolute path:

```powershell
& "c:\Users\Shikhar\OneDrive\Desktop\sem4_projects\NutriScan\nutriscan-ai\start-dev.bat"
```

### Image not detected

Try:
- Higher quality image
- Straight angle capture
- Barcode-only crop
- Manual product name input as fallback


## API Endpoints (Frontend Routes)

- `POST /api/scan-product`
- `POST /api/analyze-food`
- `POST /api/analyze-image`
- `GET /api/recommendations`
- `POST /api/chat`

---

## Current Status

- ML ensemble integrated and active
- OCR upload flow improved with stronger preprocessing
- Runtime feature-name compatibility fixed in inference
- Project deployed from a unified Next.js + Python bridge workflow

---

## License

See `LICENSE`.

