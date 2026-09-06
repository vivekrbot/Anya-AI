# Anya AI v1.0.4 ✨

New in this release: an **AI Instruction** field in Writing mode. Instead of
being limited to the fixed action list, type what you want in plain English —
use it on its own, or stack it on top of any existing action.

## 🆕 What's new

**AI Instruction field.** A new box sits right under Selected Text in Writing
mode, with its own **Generate** button.

| You do this | Anya does this |
|---|---|
| Select text, type an instruction (e.g. *"make this sound like a pirate"*), click **Generate** | Rewrites the selected text per your instruction |
| Leave nothing selected, type an idea (e.g. *"write a 3-sentence launch announcement for a note-taking app"*), click **Generate** | Generates new content from scratch |
| Type an instruction **and** click an existing action (Improve Writing, Shorten, Frank Tone, AI Suggest, Prompt Tools, ...) | Runs that action as usual, with your instruction applied on top as extra guidance |

Leave the field empty and every action button behaves exactly as before —
nothing about the existing Writing or Comment mode workflows changes.

## ✅ Still included

Writing mode (AI Suggest, Improve, Fix Grammar, Shorten, Expand,
Professional/Friendly tones, Frank & Harvey actors), Comment mode (12 reply
styles with tone & length controls), Prompt Tools (Generic Style & Image
Prompting), local-only API key, bundled fonts, no tracking. See
[PRIVACY.md](https://github.com/vivekrbot/Anya-AI/blob/main/PRIVACY.md).

## 📦 Install / Update

1. Download **`anya-ai-v1.0.4.zip`** below.
2. Unzip it to a folder you'll keep. On Windows, use a clean extraction so no files
   are dropped:
   ```powershell
   Unblock-File "$HOME\Downloads\anya-ai-v1.0.4.zip"
   Expand-Archive "$HOME\Downloads\anya-ai-v1.0.4.zip" -DestinationPath "$HOME\Anya-AI" -Force
   ```
3. Open `chrome://extensions` → enable **Developer mode**.
4. Click **Load unpacked** → select the folder that contains `manifest.json`.
5. Open Settings (gear icon) and add your free
   [Groq API key](https://console.groq.com/keys) — the in-app guide walks you through it.

> **Updating from v1.0.3?** Replace your existing folder's contents with the new
> zip, then hit refresh on the Anya AI card in `chrome://extensions`. Your API key
> and settings carry over unchanged.

## 🙏 Credits

Made with ❤️ by Bot Studio · Itsvivek.Design
