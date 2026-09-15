#!/bin/bash
echo "Starting Strata-X services..."

cd /home/umang/Desktop/Strata-x/Dashboard/strata-x/backend
python3 -c "from main import app; import uvicorn; uvicorn.run(app, host='0.0.0.0', port=8000)" &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

cd /home/umang/Desktop/Strata-x/Dashboard/strata-x/auth-server
node node_modules/.bin/tsx watch src/index.ts &
AUTH_PID=$!
echo "Auth server PID: $AUTH_PID"

cd /home/umang/Desktop/Strata-x/Dashboard/strata-x
npx vite --port 5173 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo "All services started!"
echo "Backend: http://127.0.0.1:8000"
echo "Auth: http://127.0.0.1:3001"
echo "Frontend: http://127.0.0.1:5173"

wait $BACKEND_PID $AUTH_PID $FRONTEND_PID
