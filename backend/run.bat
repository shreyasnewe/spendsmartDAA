@echo off
echo ========================================================
echo  Starting SpendSmart C++ 0/1 Knapsack Server on Port 5000
echo ========================================================

cd /d "%~dp0"

if not exist "%~dp0spendsmart_server.exe" (
    echo spendsmart_server.exe not found. Running build.bat first...
    call "%~dp0build.bat"
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Build failed. Server cannot start.
        exit /b 1
    )
)

echo Listening on http://localhost:5000
"%~dp0spendsmart_server.exe" 5000
