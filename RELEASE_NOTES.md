# Anya AI v1.0.3 🔧

**Required update.** Groq retired the models Anya AI shipped with, so every
action in v1.0.2 and earlier now fails with an `API error (404)`. This release
moves to Groq's current models and repairs existing installs automatically.

## 🐛 What was broken

Groq [decommissioned](https://console.groq.com/docs/deprecations) every model in
the extension's list. The default one, `llama-3.1-8b-instant`, shut down on
**16 August 2026** — which is when Improve, Fix Grammar, tone changes, comments,
and Prompt Tools all started returning a 404.

`llama-3.3-70b-versatile` shut down the same day; `llama-3.1-70b-versatile`,
`mixtral-8x7b-32768`, and `gemma2-9b-it` had gone earlier.

## 🆕 What's changed

**New models.** Anya AI now runs on Groq's current production lineup:

| Model | Use it for |
|---|---|
| **GPT-OSS 20B** *(new default)* | Fastest responses — the right pick for rewrites, tone changes, and comments |
| **GPT-OSS 120B** | Higher quality when you want a more considered result |
| **Qwen 3.6 27B** | A balanced middle ground |

**Your settings migrate themselves.** If you'd saved a model in Settings, that
choice pointed at a model that no longer exists. Anya AI now detects a retired
model and switches you to its modern equivalent on the next run — you don't have
to open Settings or reconfigure anything.

**"Test API key" works again.** Key testing was checking against a
decommissioned model, so it reported perfectly valid keys as invalid.

**Clearer errors.** If a model is ever retired again, you'll see which model is
unavailable and what to do, instead of a bare `API error (404)`.

**Faster, cleaner output.** The new models reason before answering, so internal
reasoning is now suppressed — it can't eat into your response length or leak
into the text pasted back into the page.

## ✅ Still included

Writing mode (AI Suggest, Improve, Fix Grammar, Shorten, Expand,
Professional/Friendly tones, Frank & Harvey actors), Comment mode (12 reply
styles with tone & length controls), Prompt Tools (Generic Style & Image
Prompting), local-only API key, bundled fonts, no tracking. See
[PRIVACY.md](https://github.com/vivekrbot/Anya-AI/blob/main/PRIVACY.md).

## 📦 Install / Update

1. Download **`anya-ai-v1.0.3.zip`** below.
2. Unzip it to a folder you'll keep. On Windows, use a clean extraction so no files
   are dropped:
   ```powershell
   Unblock-File "$HOME\Downloads\anya-ai-v1.0.3.zip"
   Expand-Archive "$HOME\Downloads\anya-ai-v1.0.3.zip" -DestinationPath "$HOME\Anya-AI" -Force
   ```
3. Open `chrome://extensions` → enable **Developer mode**.
4. Click **Load unpacked** → select the folder that contains `manifest.json`.
5. Open Settings (gear icon) and add your free
   [Groq API key](https://console.groq.com/keys) — the in-app guide walks you through it.

> **Updating from v1.0.2?** Replace your existing folder's contents with the new
> zip, then hit refresh on the Anya AI card in `chrome://extensions`. Your API key
> and settings carry over, and the retired model is swapped out for you.

## 🙏 Credits

Made with ❤️ by Bot Studio · Itsvivek.Design
