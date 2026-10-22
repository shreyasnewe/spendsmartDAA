@echo off
echo ========================================================
echo  Building SpendSmart C++ Backend for Windows
echo ========================================================

cd /d "%~dp0"

REM 1. Try MinGW / GCC
where g++ >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Found MinGW g++. Compiling with C++17...
    g++ -std=c++17 -O2 main.cpp -o spendsmart_server.exe -lws2_32
    if %ERRORLEVEL% EQU 0 (
        echo [SUCCESS] spendsmart_server.exe compiled successfully!
        goto done
    ) else (
        echo [ERROR] MinGW compilation failed.
    )
)

REM 2. Try MSVC (cl.exe)
where cl >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Found MSVC cl.exe. Compiling with C++17...
    cl /std:c++17 /O2 /EHsc /utf-8 /I. main.cpp /Fe:spendsmart_server.exe ws2_32.lib
    if %ERRORLEVEL% EQU 0 (
        echo [SUCCESS] spendsmart_server.exe compiled successfully!
        goto done
    ) else (
        echo [ERROR] MSVC compilation failed.
    )
)

echo.
echo [ERROR] Neither g++ (MinGW) nor cl (MSVC) was found in your PATH.
echo Please install MinGW-w64 or Visual Studio C++ Build Tools.
exit /b 1

:done
echo.
echo Ready! Run 'run.bat' to start the backend on port 5000.
