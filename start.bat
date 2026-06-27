@echo off
title GreenBin Launcher

cd /d "%~dp0"

echo Starting GreenBin...
echo.

REM Get local IPv4 address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set IP=%%a
    goto got_ip
)

:got_ip
set IP=%IP: =%

REM Start backend
start "GreenBin Backend" cmd /k "cd backend && node server.js"

timeout /t 3 /nobreak > nul

REM Start frontend with phone access
start "GreenBin Frontend" cmd /k "cd frontend && npm run dev -- --host 0.0.0.0"

timeout /t 6 /nobreak > nul

echo Open on PC:
echo http://localhost:5173
echo.
echo Open on phone:
echo http://%IP%:5173
echo.
echo Make sure phone and PC are on same Wi-Fi.
echo.

start http://localhost:5173

pause