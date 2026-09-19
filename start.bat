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

:: 2. Check and initialize Database
echo [*] Checking database configuration...
if not exist "backend\prisma\dev.db" (
    echo [*] First-time setup: Initializing and seeding local database...
    cd backend
    call npx prisma db push --skip-generate
    call npm run db:seed
    call npm run build
    cd ..
    echo [OK] Database initialized with default schools and credentials!
)

:: 3. Ensure Prisma Client is generated
echo [*] Checking Prisma client...
cd backend
call npx prisma generate >nul 2>&1
cd ..

:: 4. Start Backend in separate window
echo [*] Launching ClubGo Backend server (Port 5000)...
start "ClubGo Backend [Port 5000]" cmd /k "cd /d "%~dp0backend" && node dist/index.js"

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
echo    - Public Registration:      http://localhost:5173
echo    - Volunteer Mobile Scanner:  http://localhost:5173 (Click 'Volunteer Scanner')
echo    - Super Admin Dashboard:    http://localhost:5173 (Click 'Admin Panel')
echo    - Backend API & WebSockets:  http://localhost:5000
echo.
echo  Super Admin Credentials:
echo    - Super Admin: singhkaushal.2507@gmail.com / @Kaushal#^1012
echo.
echo  Press any key to exit this launcher window (servers will stay running).
echo ======================================================================
pause >nul
