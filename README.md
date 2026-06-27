# Anya AI - Chrome Extension

AI Writing Assistant powered by Groq. Rewrite, fix grammar, change tone, shorten, expand, and generate replies — all from your browser.

## Install on any device (from GitHub Releases)

No Chrome Web Store needed. Every version tag produces a prebuilt zip on the
[Releases page](https://github.com/vivekrbot/Anya-AI/releases), so all your devices
run the exact same build.

1. Go to **[Releases](https://github.com/vivekrbot/Anya-AI/releases)** and download
   the latest `anya-ai-vX.Y.Z.zip`.
2. Unzip it to a folder you'll keep (don't delete it — Chrome loads from this folder).
3. Open `chrome://extensions` → enable **Developer mode** (top-right).
4. Click **Load unpacked** → select the unzipped folder.
5. Open Settings (gear icon) and follow the in-app steps to add your free
   [Groq API key](https://console.groq.com/keys). The key is stored only on that
   device — enter it once per device.

**To update a device:** download the newer release zip, replace the folder contents,
then click the refresh icon on the extension card in `chrome://extensions`.
> Unpacked extensions do not auto-update — that's the trade-off for not using the Web Store.

## Cutting a release (maintainer)

The [release workflow](.github/workflows/release.yml) builds and publishes
automatically when you push a version tag:

```bash
git tag v1.0.1
git push origin v1.0.1
```

GitHub Actions then builds, sets the manifest version to match the tag, and attaches
`anya-ai-v1.0.1.zip` to a new Release — guaranteeing every device that downloads it
runs an identical version.

## Setup (Developer Mode / build from source)

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

**Security**: The API key is stored in `chrome.storage.local` and read only by the service worker. It is sent only to Groq (`https://api.groq.com`) as an auth header. Fonts are bundled locally — no remote resources are loaded. The extension makes no analytics or telemetry calls. See [PRIVACY.md](PRIVACY.md).

## Packaging

```bash
npm run package    # Creates anya-ai-v{version}.zip
```

## Settings

- **Model**: Default `llama-3.1-8b-instant` (fast). Change to `llama-3.3-70b-versatile` for higher quality.
- **Temperature**: 0.0 (deterministic) to 2.0 (creative). Default: 0.7
- **Response Length**: Short, Medium, Long
- **Default Tone**: Professional, Friendly, Direct
