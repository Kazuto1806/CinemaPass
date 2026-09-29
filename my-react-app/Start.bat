@echo off

echo ==============================
echo STARTING CINEMA PROJECT
echo ==============================
echo.

echo [1/2] Starting ASP.NET Core Backend...
start "Cinema Backend" cmd /k "cd /d %~dp0backend && dotnet run --urls http://localhost:5000"

echo.

echo [2/2] Starting React Frontend...
start "Cinema Frontend" cmd /k "cd /d %~dp0 && npm run dev"

echo.

echo ==============================
echo BACKEND + FRONTEND STARTED
echo ==============================
echo.
echo Backend:
echo http://localhost:5000
echo Swagger:
echo http://localhost:5000/swagger
echo Frontend:
echo http://localhost:5173
echo.

timeout /t 5 /nobreak >nul

start http://localhost:5173
start http://localhost:5000/swagger

exit