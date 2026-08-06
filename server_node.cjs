const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3005;

// Zero-dependency .env loader for maximum compatibility across Node/Termux versions
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        // Trim quotes if present
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        process.env[key] = value.trim();
      }
    });
    console.log('[+] Environment variables loaded successfully from .env');
  } else {
    console.warn('[!] .env file not found. Running in mock-only mode.');
  }
} catch (e) {
  console.warn('[!] Failed to load .env file:', e.message);
}

app.use(cors());
app.use(express.json());

// Serve static assets from our Vite build in production/fallback mode
app.use(express.static(path.join(__dirname, 'dist')));

// API translation endpoint fallback matching standard server endpoints
// Completely avoids body-parsing of large video files to bypass Termux temp folder crashes
app.post('/api/translate', (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("[!] GEMINI_API_KEY is missing in your .env configuration. Falling back to local mock translation for testing.");
    }
    
    // Mock response structure to allow testing and timeline use without API keys
    res.json({
      duration: 22,
      subtitles: [
        { id: "s1", startTime: 1.0, endTime: 4.5, translatedText: "Hello and welcome to the Subtitles Advanced studio!" },
        { id: "s2", startTime: 5.0, endTime: 9.5, translatedText: "This video translation pipeline is fully active." },
        { id: "s3", startTime: 10.0, endTime: 15.0, translatedText: "Your interactive audio waveform timeline is synced at 60fps." },
        { id: "s4", startTime: 15.5, endTime: 21.0, translatedText: "You can drag, drop, and edit subtitle segments natively." }
      ]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fallback to index.html for Single Page App (SPA) router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Explicitly listen on '0.0.0.0' to bind to all IPv4 & IPv6 loopbacks natively on Android
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Node.js fallback server listening on http://127.0.0.1:${PORT}`);
});
