@echo off
setlocal enabledelayedexpansion

title ClubGo - University Event & Attendance Platform Launcher
cls

echo ======================================================================
echo    ClubGo - University Event Registration & Attendance Platform
echo ======================================================================
echo.

cd /d "%~dp0"

:: 1. Ensure backend .env exists
if not exist "backend\.env" (
    echo [i] backend\.env not found. Creating from .env.example...
    copy "backend\.env.example" "backend\.env" >nul
    echo [OK] Created backend\.env
)

:: 2. Check Docker / PostgreSQL
echo [*] Checking Docker and local PostgreSQL...
docker info >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Docker daemon detected. Starting PostgreSQL container...
    docker compose up -d
) else (
    echo [i] Docker is not active. Using existing PostgreSQL or Cloud Database (Supabase/Neon)
    echo     configured in backend\.env
)

:: 3. Generate Prisma client
echo [*] Ensuring Prisma Client is generated...
cd backend
call npx prisma generate >nul 2>&1
cd ..

:: 4. Start Backend in separate window
echo [*] Launching ClubGo Backend server (Port 5000)...
start "ClubGo Backend [Port 5000]" cmd /k "cd /d "%~dp0backend" && npm run dev"

:: Wait a brief moment for backend to initialize
timeout /t 3 /nobreak >nul

:: 5. Start Frontend in separate window
echo [*] Launching ClubGo Frontend application (Port 5173)...
start "ClubGo Frontend [Port 5173]" cmd /k "cd /d "%~dp0frontend" && npm run dev"

:: Wait for Vite dev server to start
timeout /t 2 /nobreak >nul

:: 6. Open Browser
echo [*] Opening ClubGo in your default browser...
start http://localhost:5173

echo.
echo ======================================================================
echo    [SUCCESS] ClubGo is running!
echo ======================================================================
echo.
echo  Access Points:
echo    - Public Registration:     http://localhost:5173
echo    - Volunteer Mobile Scanner: http://localhost:5173 (Select 'Volunteer')
echo    - Super Admin Dashboard:   http://localhost:5173 (Select 'Admin')
echo    - Backend API & WebSockets: http://localhost:5000
echo.
echo  Demo Credentials:
echo    - Super Admin: admin@clubgo.edu   / Admin@123
echo    - Faculty:     faculty@clubgo.edu / Faculty@123
echo    - Volunteer:   volunteer@clubgo.edu / Volunteer@123
echo.
echo  Press any key to exit this launcher window (servers will stay running).
echo ======================================================================
pause >nul
