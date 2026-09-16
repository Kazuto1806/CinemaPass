@echo off

echo ==============================
echo STARTING CINEMA PROJECT
echo ==============================

echo.
echo [1/2] Starting ASP.NET Core Backend...
start "Cinema Backend" cmd /k "cd /d %~dp0backend && dotnet run"

echo.
echo [2/2] Starting React Frontend...
start "Cinema Frontend" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ==============================
echo BACKEND + FRONTEND STARTED
echo ==============================

pause