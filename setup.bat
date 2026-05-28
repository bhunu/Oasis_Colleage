@echo off
REM Install project dependencies and start dev server
REM Run this script with: setup.bat

echo ======================================
echo Oasis College Admin Dashboard Setup
echo ======================================
echo.

echo Installing dependencies...
echo.

REM Bypass PowerShell execution policy and run npm install
powershell -ExecutionPolicy Bypass -Command "npm install react-firebase-hooks recharts tabler-icons-react"

if errorlevel 1 (
    echo.
    echo ERROR: Failed to install dependencies
    echo Please ensure Node.js and npm are installed
    pause
    exit /b 1
)

echo.
echo ======================================
echo Installation Complete!
echo ======================================
echo.
echo Starting development server...
echo The application will open at http://localhost:5173/
echo.

powershell -ExecutionPolicy Bypass -Command "npm run dev"

pause
