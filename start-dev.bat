@echo off
REM Set Python binary path for ML bridge
set PYTHON_BIN=c:\Users\Shikhar\OneDrive\Desktop\sem4_projects\NutriScan\.venv\Scripts\python.exe
set PYTHONWARNINGS=ignore

REM Change to frontend directory
cd /d "c:\Users\Shikhar\OneDrive\Desktop\sem4_projects\NutriScan\nutriscan-ai\frontend"

REM Start dev server on port 3000 (default)
echo ============================================================
echo Starting NutriScan Dev Server with ML Bridge
echo ============================================================
echo.
echo Python executable: %PYTHON_BIN%
echo Frontend directory: %cd%
echo.
echo The app will be available at:
echo   http://localhost:3000
echo.
echo Note: First request may be slower due to OCR model loading (30-60s).
echo Press Ctrl+C to stop the server.
echo ============================================================
echo.
npm run dev
