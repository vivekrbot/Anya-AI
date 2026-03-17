# Anya AI — Chrome Extension

AI Writing Assistant powered by Groq. Rewrite, fix grammar, change tone, shorten, expand, and generate replies — all from your browser.

## Setup (Developer Mode)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Build**
   ```bash
   npm run build        # Production build → dist/
   npm run dev          # Dev build (source maps, no minification)
   ```

3. **Load in Chrome**
   - Open `chrome://extensions`
   - Enable "Developer mode" (top-right)
   - Click "Load unpacked" → select the `dist/` folder
   - The Anya AI icon appears in your toolbar

4. **Configure API Key**
   - Click the Anya AI icon → Settings (gear icon at bottom)
   - Enter your [Groq API key](https://console.groq.com/keys)
   - Click "Save Key", then "Test Key" to verify

## How to Use

1. **Click the Anya AI icon** in the toolbar — the side panel opens
2. **Select text** on any webpage — it automatically appears in the side panel
3. **Choose an action**:
   - **Improve Writing** — polish clarity and flow
   - **Fix Grammar** — correct grammar/spelling only
   - **Professional Tone** — formal, business-appropriate
   - **Friendly Tone** — warm and conversational
   - **Shorten** — condense while preserving meaning
   - **Expand** — add detail and elaboration
5. **Quick Actors** (persona-based):
   - **Frank Tone** — blunt, candid, no-nonsense
   - **Harvey Tone** — authoritative and persuasive (Harvey Specter-inspired)
6. **Use the result**: Replace original text, Insert after, or Copy to clipboard

### Comment Mode

Toggle "Comment Mode" to switch behavior:
- **External text selected**: generates a reply to it
- **Text inside an input field**: rewrites/improves your draft

## Architecture

```
src/
├── background/service-worker.js   # Groq API gateway (API key stays here)
├── content/content-script.js      # Selection capture + text replacement
├── sidepanel/                     # Main UI — Chrome Side Panel (sidepanel.html/css/js)
├── options/                       # Settings page (options.html/css/js)
└── shared/                        # Constants, prompts, storage, messaging
```

**Security**: The API key is stored in `chrome.storage.local` and read only by the service worker. It is never exposed to content scripts or the side panel.

## Packaging

```bash
npm run package    # Creates anya-ai-v{version}.zip
```

## Settings

- **Model**: Default `llama-3.1-8b-instant` (fast). Change to `llama-3.3-70b-versatile` for higher quality.
- **Temperature**: 0.0 (deterministic) to 2.0 (creative). Default: 0.7
- **Response Length**: Short, Medium, Long
- **Default Tone**: Professional, Friendly, Direct
