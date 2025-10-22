@echo off
REM Quick start script for Windows development

echo ===================================
echo Discord Bot - Development Mode
echo ===================================
echo.

REM Check if .env exists
if not exist ".env" (
    echo [ERROR] .env file not found!
    echo Please copy .env.example to .env and configure it
    echo.
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call npm install
    echo.
)

echo [INFO] Starting bot and API...
echo.
echo Bot logs will appear below:
echo ===================================
echo.

REM Start both bot and API
start "Discord API" cmd /k "npm run dev"

echo.
echo ===================================
echo Bot is running!
echo ===================================
echo.
echo API available at: http://localhost:3001
echo.
echo Press any key to stop...
pause

REM Kill the processes when done
taskkill /FI "WINDOWTITLE eq Discord API*" /T /F
