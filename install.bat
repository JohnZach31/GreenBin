@echo off
title GreenBin Installer

cd /d "%~dp0"

echo ========================================
echo        GreenBin Installer
echo ========================================
echo.

echo Current folder:
cd
echo.

echo Checking Node.js...
node -v
if errorlevel 1 goto node_error

echo.
echo Checking npm...
call npm -v
if errorlevel 1 goto npm_error

echo.
echo Checking project folders...

if not exist "backend" goto backend_missing
if not exist "frontend" goto frontend_missing

echo [OK] backend folder found.
echo [OK] frontend folder found.

echo.
echo ========================================
echo Installing backend dependencies...
echo ========================================
echo.

cd backend

if not exist "package.json" goto backend_package_missing

call npm install
if errorlevel 1 goto backend_install_error

echo.
echo [OK] Backend dependencies installed successfully.

cd ..

echo.
echo ========================================
echo Installing frontend dependencies...
echo ========================================
echo.

cd frontend

if not exist "package.json" goto frontend_package_missing

call npm install
if errorlevel 1 goto frontend_install_error

echo.
echo [OK] Frontend dependencies installed successfully.

cd ..

echo.
echo ========================================
echo Installation complete.
echo ========================================
echo.

choice /c YN /m "Run GreenBin now?"

if errorlevel 2 goto dont_run
if errorlevel 1 goto run_greenbin

:run_greenbin
echo.
echo Starting GreenBin...
call start.bat
exit /b 0

:dont_run
echo.
echo No problem. You can run GreenBin later by double-clicking:
echo start.bat
echo.
pause
exit /b 0

:node_error
echo.
echo [ERROR] Node.js was not found.
echo Install Node.js from https://nodejs.org/
echo.
pause
exit /b 1

:npm_error
echo.
echo [ERROR] npm was not found.
echo npm should come with Node.js.
echo Try reinstalling Node.js.
echo.
pause
exit /b 1

:backend_missing
echo.
echo [ERROR] backend folder was not found.
echo Make sure install.bat is inside the GreenBin root folder.
echo.
pause
exit /b 1

:frontend_missing
echo.
echo [ERROR] frontend folder was not found.
echo Make sure install.bat is inside the GreenBin root folder.
echo.
pause
exit /b 1

:backend_package_missing
echo.
echo [ERROR] backend/package.json was not found.
echo Cannot install backend dependencies.
echo.
pause
exit /b 1

:frontend_package_missing
echo.
echo [ERROR] frontend/package.json was not found.
echo Cannot install frontend dependencies.
echo.
pause
exit /b 1

:backend_install_error
echo.
echo [ERROR] Backend npm install failed.
echo Read the error above.
echo.
pause
exit /b 1

:frontend_install_error
echo.
echo [ERROR] Frontend npm install failed.
echo Read the error above.
echo.
pause
exit /b 1