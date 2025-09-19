@echo off
echo ========================================
echo    SWITCH CONFIG FOR 2-MACHINE TESTING
echo ========================================
echo.
echo 1. Local testing (1 machine, 2 tabs)
echo 2. LAN testing (2 machines, 2 accounts)
echo.
set /p choice="Choose option (1 or 2): "

if "%choice%"=="1" (
    echo Switching to LOCAL config...
    powershell -Command "(Get-Content 'frontend/index.html') -replace '<!-- <script src=\"js/config.js\"></script> -->', '<script src=\"js/config.js\"></script>' -replace '<script src=\"js/config-lan.js\"></script>', '<!-- <script src=\"js/config-lan.js\"></script> -->' | Set-Content 'frontend/index.html'"
    echo ✅ Switched to LOCAL config
    echo Now you can test with 2 tabs on same machine
) else if "%choice%"=="2" (
    echo Switching to LAN config...
    powershell -Command "(Get-Content 'frontend/index.html') -replace '<script src=\"js/config.js\"></script>', '<!-- <script src=\"js/config.js\"></script> -->' -replace '<!-- <script src=\"js/config-lan.js\"></script> -->', '<script src=\"js/config-lan.js\"></script>' | Set-Content 'frontend/index.html'"
    echo ✅ Switched to LAN config
    echo Now you can test with 2 different machines
    echo Make sure to copy this project to the second machine
) else (
    echo Invalid choice. Please run again and choose 1 or 2.
)

echo.
pause
