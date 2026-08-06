@echo off
title Subtitles Advanced - One-Click Launcher
echo ===================================================
echo   Subtitles Advanced - One-Click Launcher
echo ===================================================
echo.

:: Check for Bun installation
where bun >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] Bun is not installed on your system.
    echo [*] Installing Bun (a super-fast runtime for running this app)...
    powershell -c "irm bun.sh/install.ps1 | iex"
    if %errorlevel% neq 0 (
        echo [!] Automatic installation failed. Please install Bun manually from https://bun.sh
        pause
        exit /b
    )
    echo [+] Bun successfully installed!
    echo.
) else (
    echo [+] Bun is already installed.
)

:: Copy .env.example to .env if .env doesn't exist
if not exist .env (
    echo [*] Creating your .env file...
    copy .env.example .env >nul
    echo [+] Created .env. Please open it and paste your Gemini API key!
)

echo [*] Installing dependencies (this will be quick)...
call bun install
if %errorlevel% neq 0 (
    echo [!] Failed to install dependencies.
    pause
    exit /b
)

echo.
echo ===================================================
echo [+] Starting the Bun Backend Server (Port 3000)...
echo ===================================================
start "Subtitles Advanced Backend" bun server.ts

echo.
echo ===================================================
echo [+] Launching the Vite Frontend Server (Port 5173)...
echo ===================================================
echo.

:: Automatically open default web browser locally
echo [*] Automatically opening Subtitles Advanced in your web browser...
start http://localhost:5173

call bun run dev
pause
