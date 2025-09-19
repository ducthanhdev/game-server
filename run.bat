@echo off
echo ========================================
echo    Starting Server Game MVC Project
echo ========================================

echo.
echo [1/4] Starting MongoDB...
net start MongoDB
if %errorlevel% neq 0 (
    echo Warning: MongoDB might already be running or not installed
)

echo.
echo [2/4] Installing Backend Dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo Error: Failed to install backend dependencies
    pause
    exit /b 1
)

echo.
echo [3/4] Starting Backend API Server...
start "Backend API" cmd /k "cd backend && npm run start:dev"

echo.
echo [4/4] Installing Frontend Dependencies...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo Error: Failed to install frontend dependencies
    pause
    exit /b 1
)

echo.
echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd frontend && npm start"

echo.
echo Waiting for servers to start...
timeout /t 8

echo.
echo Opening browser...
start http://localhost:8080

echo.
echo ========================================
echo    All Services Started Successfully!
echo ========================================
echo.
echo Frontend: http://localhost:8080
echo Backend:  http://localhost:3000
echo MongoDB:  mongodb://localhost:27017
echo.
echo Press any key to exit...
pause >nul
