# Anya AI v1.0.1 ✨

This release adds **Prompt Tools** — turn plain English into high-quality prompts,
right inside the side panel.

## 🆕 What's new

**Prompt Tools (Writing mode)** — two categories:

- **Generic Style** — converts your plain-English request into a structured,
  copy-paste prompt: Role, Task, Context, Audience, Constraints, Inputs Provided,
  and Output Format — plus a Missing Details Checklist. Unknowns are flagged as
  `[MISSING: ...]` so nothing is invented.

- **Image Prompting** — converts a plain-English description into a ready-to-paste
  text-to-image prompt (Midjourney, DALL·E, Stable Diffusion, etc.). It follows a
  clear 4-step method — understand the request and its limits, outline the image,
  flag what's missing, then finalize — and returns:
  - an **Outline** (Subject, Style, Composition, Lighting, Color & Mood, Camera/Lens,
    Details, Aspect Ratio, Negative Prompt),
  - a **Missing Information** list, and
  - a **Final Prompt** you can copy-paste, with any gaps marked inline in `[brackets]`.

## ✅ Still included from v1.0.0

Writing mode (AI Suggest, Improve, Fix Grammar, Shorten, Expand, Professional/Friendly
tones, Frank & Harvey actors), Comment mode (12 reply styles with tone & length
controls), local-only API key, bundled fonts, no tracking. See
[PRIVACY.md](https://github.com/vivekrbot/Anya-AI/blob/main/PRIVACY.md).

## 📦 Install

1. Download **`anya-ai-v1.0.1.zip`** below.
2. Unzip it to a folder you'll keep. On Windows, use a clean extraction so no files
   are dropped:
   ```powershell
   Unblock-File "$HOME\Downloads\anya-ai-v1.0.1.zip"
   Expand-Archive "$HOME\Downloads\anya-ai-v1.0.1.zip" -DestinationPath "$HOME\Anya-AI" -Force
   ```
3. Open `chrome://extensions` → enable **Developer mode**.
4. Click **Load unpacked** → select the folder that contains `manifest.json`.
5. Open Settings (gear icon) and add your free
   [Groq API key](https://console.groq.com/keys) — the in-app guide walks you through it.

> Unpacked extensions don't auto-update. To update, download the newer zip, replace
> the folder contents, and hit refresh on the extension card in `chrome://extensions`.

## 🙏 Credits

Made with ❤️ by Bot Studio · Itsvivek.Design
