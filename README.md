# 🎬 Subtitles Advanced - Interactive Subtitle Studio

Welcome! **Subtitles Advanced** is an elegant, high-performance web application designed to automatically transcribe foreign language videos and translate them into easy-read English subtitles.

This studio is built with speed and simplicity in mind, combining **WhisperX** (for fast voice-to-text diarization) and **Gemini AI** (for contextual English translation).

---

## 🚀 Easy Double-Click Startup (No Coding Required!)

If you do not have software development experience, we have made starting the application as simple as possible.

### For Windows Users:
1. Double-click the file named **`start.bat`**.
2. The script will automatically install **Bun** (the engine that runs the app), prepare your settings file, install necessary libraries, and start the app.
3. Once running, open your web browser and navigate to the address shown (usually `http://localhost:5173`).

### For Mac / Linux Users:
1. Open your Terminal.
2. Run the command: `chmod +x start.sh` (this grants permission to run the script).
3. Double-click **`start.sh`** or run `./start.sh` in the Terminal.

---

## ⚙️ Configuration (Adding Your Gemini API Key)

To translate subtitles, the app needs access to Google Gemini. 
1. Open the newly created **`.env`** file in the project folder with any text editor (like Notepad or TextEdit).
2. Look for the line:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
3. Replace `your_api_key_here` with your actual Gemini API key from Google AI Studio.
4. Save and close the file.

---

## 🕹️ Key Features

*   **⚡ Ultra-Fast Installations**: Powered by **Bun** for instant boot-ups.
*   **🎙️ Multi-Lingual WhisperX**: Pinpoint temporal alignment of speaker shifts across Spanish, French, Japanese, German, and more.
*   **🤖 Smart Translation**: Uses Gemini Flash to distill spoken dialogue into clear, simplified, easy-read English.
*   **⏱️ Interactive Timeline**: Simply drag, drop, and edit subtitle blocks dynamically in the browser.
*   **📉 Code-Splitting Optimization**: Automatically optimized for maximum browser smoothness and minimal memory usage.
