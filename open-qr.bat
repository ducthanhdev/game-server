@echo off
echo ========================================
echo    OPEN QR CODE FOR PHONE TESTING
echo ========================================
echo.

echo Opening QR Code generator...
start generate-qr.html

echo.
echo ========================================
echo    INSTRUCTIONS FOR PHONE TESTING
echo ========================================
echo.
echo 1. QR Code page will open in your browser
echo 2. Scan the QR code with your phone
echo 3. Or manually enter: http://192.168.0.106:8080
echo 4. Make sure both devices are on same WiFi
echo.
echo Press any key to continue...
pause > nul
