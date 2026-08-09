#!/bin/bash
echo "==================================================="
echo "  Subtitles Advanced - Node.js Fallback Launcher"
echo "==================================================="
echo ""

# Check for Node.js installation natively in Termux
if ! command -v node &> /dev/null
then
    echo "[*] Node.js is missing. Installing nodejs package natively via pkg..."
    pkg install -y nodejs
else
    echo "[+] Node.js is already installed."
fi

# Copy environmental example if .env does not exist
if [ ! -f .env ]; then
    echo "[*] Creating .env config file..."
    cp .env.example .env
    echo "[+] Created .env. Please open it and add your Gemini API key."
fi

echo "[*] Installing Node.js fallback server dependencies..."
npm install express cors

echo "[*] Installing project build dependencies..."
npm install

echo "[*] Compiling Vite production bundle..."
npm run build

echo ""
echo "==================================================="
echo "[+] Starting the Node.js Backend Server (Port 3005)..."
echo "==================================================="
node server_node.cjs &
NODE_PID=$!

# Automatically open default Android web browser on start (using raw IP 127.0.0.1:3005)
if command -v termux-open &> /dev/null; then
    echo "[*] Launching your default browser..."
    (sleep 2 && termux-open http://127.0.0.1:3005) &
fi

# Keep script running and listen for termination to clean up process
wait $NODE_PID
kill $NODE_PID 2>/dev/null
