# Anya AI v1.0.2 ✨

This release refines **Prompt Tools** so both prompt types return a single,
ready-to-paste prompt — no editing required before use.

## 🆕 What's changed

**Prompt Tools (Writing mode):**

- **Generic Style** no longer returns a Missing Details Checklist or
  `[MISSING: ...]` placeholders. Any detail your request doesn't spell out
  (style, tone, audience, format, etc.) is now filled in automatically with
  a sensible default inferred from what you typed — so the result pastes
  straight into any AI model as-is.

- **Image Prompting** no longer returns an Outline or a Missing Information
  list, and no longer marks gaps inline with `[brackets]`. It now returns
  only the finished image prompt, with unspecified details (art style,
  lighting, mood, aspect ratio, etc.) auto-filled the same way.

You can still edit the result afterward in the side panel if you want to
add something — the tool just won't force you to fill in blanks first.

## ✅ Still included from v1.0.1

Writing mode (AI Suggest, Improve, Fix Grammar, Shorten, Expand,
Professional/Friendly tones, Frank & Harvey actors), Comment mode (12 reply
styles with tone & length controls), local-only API key, bundled fonts, no
tracking. See
[PRIVACY.md](https://github.com/vivekrbot/Anya-AI/blob/main/PRIVACY.md).

## 📦 Install

1. Download **`anya-ai-v1.0.2.zip`** below.
2. Unzip it to a folder you'll keep. On Windows, use a clean extraction so no files
   are dropped:
   ```powershell
   Unblock-File "$HOME\Downloads\anya-ai-v1.0.2.zip"
   Expand-Archive "$HOME\Downloads\anya-ai-v1.0.2.zip" -DestinationPath "$HOME\Anya-AI" -Force
   ```
3. Open `chrome://extensions` → enable **Developer mode**.
4. Click **Load unpacked** → select the folder that contains `manifest.json`.
5. Open Settings (gear icon) and add your free
   [Groq API key](https://console.groq.com/keys) — the in-app guide walks you through it.

> Unpacked extensions don't auto-update. To update, download the newer zip, replace
> the folder contents, and hit refresh on the extension card in `chrome://extensions`.

## 🙏 Credits

Made with ❤️ by Bot Studio · Itsvivek.Design
