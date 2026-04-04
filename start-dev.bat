@echo off
setlocal

REM Resolve paths dynamically so this script works from any current directory.
set "APP_DIR=%~dp0"
if "%APP_DIR:~-1%"=="\" set "APP_DIR=%APP_DIR:~0,-1%"

for %%I in ("%APP_DIR%\..") do set "WORKSPACE_DIR=%%~fI"

set "PYTHON_BIN=%WORKSPACE_DIR%\.venv\Scripts\python.exe"
if not exist "%PYTHON_BIN%" (
	set "PYTHON_BIN=%APP_DIR%\.venv\Scripts\python.exe"
)

set "PYTHONWARNINGS=ignore"

if not exist "%APP_DIR%\frontend\package.json" (
	echo [ERROR] Cannot find frontend\package.json under "%APP_DIR%".
	exit /b 1
)

cd /d "%APP_DIR%\frontend"

REM Start dev server on port 3000 (default)
echo ============================================================
echo Starting NutriScan Dev Server with ML Bridge
echo ============================================================
echo.
echo Python executable: %PYTHON_BIN%
echo Frontend directory: %cd%
if not exist "%PYTHON_BIN%" (
	echo [WARN] Python venv executable not found at configured path.
	echo [WARN] ML routes may fail until a valid venv is available.
)
echo.
echo The app will be available at:
echo   http://localhost:3000
echo.
echo Note: First request may be slower due to OCR model loading (30-60s).
echo Press Ctrl+C to stop the server.
echo ============================================================
echo.
npm run dev

endlocal
