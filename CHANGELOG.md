# Changelog

All notable changes to Anya AI are documented here.
This project follows [Semantic Versioning](https://semver.org/).

## [1.0.4] — 2026-09-06

### Added
- **AI Instruction** field in Writing mode, with its own **Generate** button:
  - With text selected, describe how to change it (e.g. "make this sound like
    a pirate") and Generate rewrites the selection accordingly.
  - With nothing selected, describe an idea (e.g. "write a 3-sentence launch
    announcement for a note-taking app") and Generate creates new content from
    scratch.
  - Can be combined with any action button (Improve Writing, Shorten, Frank
    Tone, AI Suggest, Prompt Tools, ...) — the instruction is layered on top
    of that action as extra guidance, rather than replacing it.

## [1.0.3] — 2026-08-20

### Fixed
- **All requests failed with a 404.** Groq decommissioned every model the
  extension shipped with — `llama-3.1-8b-instant` (the default) and
  `llama-3.3-70b-versatile` shut down on 2026-08-16, and
  `llama-3.1-70b-versatile`, `mixtral-8x7b-32768`, and `gemma2-9b-it` earlier.
  The model list now tracks Groq's current production lineup:
  `openai/gpt-oss-20b` (default, fastest), `openai/gpt-oss-120b` (quality), and
  `qwen/qwen3.6-27b` (balanced).
- Saved settings naming a retired model are migrated to its replacement on
  read, so existing installs recover without visiting Settings.
- **Test API key** no longer probes a decommissioned model, which made valid
  keys report as invalid.

### Changed
- A 404 now reports which model is unavailable instead of a generic
  "API error (404)".
- Reasoning is suppressed on the new models so it can't consume the token
  budget or leak into pasted text.

## [1.0.2] — 2026-07-07

### Changed
- **Prompt Tools** now return a single, ready-to-paste prompt with no editing
  required before use:
  - **Generic Style** no longer shows a Missing Details Checklist or
    `[MISSING: ...]` placeholders. Any detail the request doesn't specify
    (style, tone, audience, format, etc.) is now filled in automatically with
    a sensible default inferred from the request.
  - **Image Prompting** no longer returns an Outline or Missing Information
    list, and no longer marks gaps inline with `[brackets]`. It now returns
    only the finished prompt, with unspecified details (art style, lighting,
    mood, aspect ratio, etc.) auto-filled the same way.

## [1.0.1] — 2026-06-26

### Added
- **Prompt Tools** in Writing mode, with two categories:
  - **Generic Style** — converts plain English into a structured, copy-paste prompt
    (Role / Task / Context / Audience / Constraints / Inputs Provided / Output Format)
    plus a Missing Details Checklist, flagging unknowns as `[MISSING: ...]`.
  - **Image Prompting** — converts a plain-English description into a copy-paste
    text-to-image prompt. Follows a 4-step method (understand → outline → flag gaps
    → finalize), returns an Outline, a Missing Information list, and a ready-to-paste
    Final Prompt with any gaps marked inline in `[brackets]`.

## [1.0.0] — 2026-06-15

First official release.

### Added
- **Writing mode**: AI Suggest, Improve Writing, Fix Grammar, Shorten, Expand,
  Professional & Friendly tones, and Quick Actors (Frank, Harvey).
- **Comment mode**: 12 reply styles with tone and length controls, plus smart
  LinkedIn post extraction.
- Result actions: Replace, Insert, and Copy into the page.
- Bring-your-own Groq API key with in-app setup instructions and key testing.
- `PRIVACY.md` and in-app privacy disclosure.
- GitHub Releases distribution: tag-triggered build workflow that publishes a
  prebuilt `anya-ai-vX.Y.Z.zip` for installing the same version across devices.

### Security
- Declared `host_permissions` scoped to `https://api.groq.com`.
- Hardened Content Security Policy to `default-src 'self'` with a scoped `connect-src`.
- Bundled the Material Symbols font locally; no remote resources are loaded.
- Removed debug logging of user-selected text.
- Validated internal message senders.
- Guarded against malformed API responses.

[1.0.0]: https://github.com/vivekrbot/Anya-AI/releases/tag/v1.0.0
