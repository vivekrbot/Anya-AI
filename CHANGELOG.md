# Changelog

All notable changes to Anya AI are documented here.
This project follows [Semantic Versioning](https://semver.org/).

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
