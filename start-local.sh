#!/usr/bin/env bash
# Launch AI Dataset Insight Platform (Backend + Frontend)
set -e

echo "=========================================================="
echo " Starting AI Dataset Insight Platform (Local Dev Mode)"
echo " Zero Cost • Zero AWS Credentials Required"
echo "=========================================================="

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Start backend in background
echo "Starting FastAPI Backend on http://127.0.0.1:8000..."
python3 -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

trap "kill $BACKEND_PID" EXIT

sleep 2

# Start frontend
echo "Starting Vite Frontend on http://localhost:5173..."
cd "$DIR/frontend"
npm run dev

