const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('express-form-data');

const app = express();
const PORT = process.env.PORT || 3005; // Switched to 3005 to avoid conflicts on port 3000

app.use(cors());
app.use(express.json());
app.use(multer.parse());

// Serve static assets from our Vite build in production/fallback mode
app.use(express.static(path.join(__dirname, 'dist')));

// API translation endpoint fallback matching standard server endpoints
app.post('/api/translate', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY in env configuration" });
    }
    
    // Fallback response structure
    res.json({
      duration: 10,
      subtitles: [
        { id: "s1", startTime: 1.0, endTime: 4.5, translatedText: "Hello and welcome to the subtitle studio!" },
        { id: "s2", startTime: 5.0, endTime: 9.0, translatedText: "Everything is synchronized perfectly." }
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

app.listen(PORT, () => {
  console.log(`Node.js fallback server listening on http://localhost:${PORT}`);
});
