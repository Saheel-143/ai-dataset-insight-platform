@echo off
echo ==========================================================
echo  Starting AI Dataset Insight Platform (Local Dev Mode)
echo  Zero Cost - Zero AWS Credentials Required
echo ==========================================================

set "PROJECT_DIR=%~dp0"
if "%PROJECT_DIR%"=="" set "PROJECT_DIR=C:\Users\Sahee\.gemini\antigravity\scratch\ai-dataset-insight-platform\"
cd /d "%PROJECT_DIR%"

echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000...
start "AI Platform Backend" py -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload

timeout /t 2 /nobreak >nul

echo [2/2] Starting Vite Frontend on http://localhost:5173...
cd /d "%PROJECT_DIR%frontend"
npm run dev

