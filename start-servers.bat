@echo off
echo ========================================
echo    STARTING GAME SERVERS
echo ========================================
echo.

echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm run start:dev"

echo Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak > nul

echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd frontend && python -m http.server 8080"

echo.
echo ========================================
echo    SERVERS STARTED
echo ========================================
echo.
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:8080
echo Phone:    http://192.168.0.106:8080
echo.
echo Test page: http://192.168.0.106:8080/test.html
echo.
echo Press any key to open game in browser...
pause > nul

start http://192.168.0.106:8080
