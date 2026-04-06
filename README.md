# NutriScan AI

NutriScan AI is a food analysis web app that helps users understand packaged products using barcode scan, product search, or image upload.

## Features

- Barcode-based product lookup
- Product name search fallback
- Image upload with OCR support
- Health score and disease-risk insights
- Healthier alternative recommendations with buy links
- Chat assistant for nutrition guidance

## Tech Stack

- Frontend: Next.js, React, Tailwind CSS
- ML/Data: Python, scikit-learn, XGBoost, EasyOCR
- Data source: Open Food Facts

## Project Structure

```text
nutriscan-ai/
  backend/
  frontend/
  ml/
  requirements.txt
  start-dev.bat
```

## Quick Start (Windows)

```powershell
git clone https://github.com/Shikhar28-web/NutriScan.git
cd NutriScan\nutriscan-ai

python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

cd frontend
npm install
cd ..

start-dev.bat
```

App URL: http://localhost:3000

## API Routes

- POST /api/scan-product
- POST /api/analyze-food
- POST /api/analyze-image
- GET /api/recommendations
- POST /api/chat

## License

See LICENSE.

