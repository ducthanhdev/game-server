#!/bin/bash

echo "========================================"
echo "   Starting Server Game MVC Project"
echo "========================================"

echo ""
echo "[1/4] Starting MongoDB..."
if command -v brew &> /dev/null; then
    brew services start mongodb-community
elif command -v systemctl &> /dev/null; then
    sudo systemctl start mongod
else
    echo "Please start MongoDB manually"
fi

echo ""
echo "[2/4] Installing Backend Dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "Error: Failed to install backend dependencies"
    exit 1
fi

echo ""
echo "[3/4] Starting Backend API Server..."
cd ..
gnome-terminal --title="Backend API" -- bash -c "cd backend && npm run start:dev; exec bash" 2>/dev/null || \
xterm -title "Backend API" -e "cd backend && npm run start:dev; bash" 2>/dev/null || \
osascript -e 'tell app "Terminal" to do script "cd backend && npm run start:dev"' 2>/dev/null || \
echo "Please open a new terminal and run: cd backend && npm run start:dev"

echo ""
echo "[4/4] Installing Frontend Dependencies..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "Error: Failed to install frontend dependencies"
    exit 1
fi

echo ""
echo "Starting Frontend Server..."
cd ..
gnome-terminal --title="Frontend Server" -- bash -c "cd frontend && npm start; exec bash" 2>/dev/null || \
xterm -title "Frontend Server" -e "cd frontend && npm start; bash" 2>/dev/null || \
osascript -e 'tell app "Terminal" to do script "cd frontend && npm start"' 2>/dev/null || \
echo "Please open a new terminal and run: cd frontend && npm start"

echo ""
echo "Waiting for servers to start..."
sleep 8

echo ""
echo "Opening browser..."
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:8080
elif command -v open &> /dev/null; then
    open http://localhost:8080
else
    echo "Please open http://localhost:8080 in your browser"
fi

echo ""
echo "========================================"
echo "   All Services Started Successfully!"
echo "========================================"
echo ""
echo "Frontend: http://localhost:8080"
echo "Backend:  http://localhost:3000"
echo "MongoDB:  mongodb://localhost:27017"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Keep script running
wait
