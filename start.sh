#!/bin/bash
echo "==================================================="
echo "  Subtitles Advanced - One-Click Launcher"
echo "==================================================="
echo ""

# Check for Bun installation
if ! command -v bun &> /dev/null
then
    echo "[!] Bun is not installed."
    echo "[*] Installing Bun (a super-fast runtime for running this app)..."
    curl -fsSL https://bun.sh/install | bash
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
    echo "[+] Bun successfully installed!"
else
    echo "[+] Bun is already installed."
fi

# Copy .env.example to .env if it doesn't exist
if [ ! -f .env ]; then
    echo "[*] Creating your .env file..."
    cp .env.example .env
    echo "[+] Created .env. Please open it and add your Gemini API key."
fi

echo "[*] Installing dependencies..."
bun install

echo ""
echo "==================================================="
echo "[+] Starting the Bun Backend Server (Port 3000)..."
echo "==================================================="
bun server.ts &
BACKEND_PID=$!

echo ""
echo "==================================================="
echo "[+] Launching the Vite Frontend Server (Port 5173)..."
echo "==================================================="
echo ""
bun run dev

# Terminate the backend server when the frontend exits
kill $BACKEND_PID
