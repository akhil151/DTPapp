@echo off
echo ========================================
echo   ElephantWatch - Starting Application
echo ========================================
echo.
echo This will start:
echo 1. Backend Server (Port 5000)
echo 2. Expo Development Server
echo.
echo Press Ctrl+C to stop
echo.
echo ========================================
echo.

cd /d "%~dp0"

echo Starting Backend Server...
start "ElephantWatch Backend" cmd /k "npm run server:dev"

timeout /t 3 /nobreak >nul

echo Starting Expo App...
start "ElephantWatch Frontend" cmd /k "npm run start"

echo.
echo ========================================
echo Both servers are starting!
echo.
echo Backend: http://localhost:5000
echo Frontend: Follow instructions in the Expo window
echo.
echo Press any key to exit this window...
echo (The servers will keep running in separate windows)
echo ========================================
pause >nul
