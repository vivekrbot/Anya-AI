# Changelog

All notable changes to Anya AI are documented here.
This project follows [Semantic Versioning](https://semver.org/).

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
