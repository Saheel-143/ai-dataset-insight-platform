# Launch AI Dataset Insight Platform (Backend + Frontend)
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Starting AI Dataset Insight Platform (Local Dev Mode)" -ForegroundColor Cyan
Write-Host " Zero Cost • Zero AWS Credentials Required" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

# Robust base directory detection
$base = $PSScriptRoot
if (-not $base -or -not (Test-Path "$base\frontend")) {
    $candidate = "C:\Users\Sahee\.gemini\antigravity\scratch\ai-dataset-insight-platform"
    if (Test-Path "$candidate\frontend") {
        $base = $candidate
    } else {
        $base = Get-Location
    }
}

Set-Location $base
Write-Host "Working directory set to: $base" -ForegroundColor Gray

# 1. Start Backend in new process
Write-Host "Starting FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Yellow
$backendJob = Start-Process -FilePath "py" -ArgumentList "-m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload" -WorkingDirectory $base -PassThru

Start-Sleep -Seconds 2

# 2. Start Frontend Vite server
Write-Host "Starting Vite Frontend on http://localhost:5173..." -ForegroundColor Yellow
Push-Location "$base\frontend"
try {
    npm run dev
} finally {
    Pop-Location
    if ($backendJob -and -not $backendJob.HasExited) {
        Write-Host "Stopping backend process..." -ForegroundColor Gray
        Stop-Process -Id $backendJob.Id -Force
    }
}
