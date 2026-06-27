@echo off
title GreenBin Installer

cd /d "%~dp0"

echo Installing GreenBin...
echo.

echo Installing backend dependencies...
cd backend
npm install

echo.
echo Installing frontend dependencies...
cd ..\frontend
npm install

echo.
echo Installation complete.
echo You can now run start.bat to open GreenBin.
echo.

pause
