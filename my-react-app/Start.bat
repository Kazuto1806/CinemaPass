
@echo off
setlocal

echo ==============================
echo STARTING CINEMA PROJECT
echo ==============================
echo.

REM Find Node.js and npm
set "NODE_DIR=C:\Program Files\nodejs"

if not exist "%NODE_DIR%\node.exe" (
    echo ERROR: Cannot find Node.js at %NODE_DIR%
    pause
    exit /b 1
)

if not exist "%NODE_DIR%\npm.cmd" (
    echo ERROR: Cannot find npm.cmd at %NODE_DIR%
    pause
    exit /b 1
)

set "PATH=%NODE_DIR%;%PATH%"

echo [1/2] Starting ASP.NET Core Backend...
start "Cinema Backend" cmd /k "cd /d %~dp0backend && dotnet run --urls http://localhost:5000"

echo.
echo [2/2] Starting React Frontend...
start "Cinema Frontend" cmd /k "cd /d %~dp0 && call "%NODE_DIR%\npm.cmd" run dev"

echo.
echo ==============================
echo START COMMANDS SENT
echo ==============================
echo Backend:  http://localhost:5000
echo Swagger:  http://localhost:5000/swagger
echo Frontend: http://localhost:5173
echo.

timeout /t 5 /nobreak >nul
start "" http://localhost:5173

endlocal
exit /b
