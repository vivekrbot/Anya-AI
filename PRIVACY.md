# Privacy Policy — Anya AI

_Last updated: 2026-06-15_

Anya AI is a browser extension that helps you rewrite, improve, and generate text
using the Groq AI API. This policy explains exactly what data the extension handles.

## What the extension does with your data

**Text you choose to process.** When you select text on a page (or paste/type it
into the side panel) and click an action, that text is sent to the Groq API
(`https://api.groq.com`) over an encrypted HTTPS connection so the model can
generate a result. This only happens when you explicitly trigger an action — the
extension does not send anything in the background.

**Your Groq API key.** Your key is stored locally on your device using
`chrome.storage.local`. It is read only by the extension's background service
worker, solely to authenticate your requests to Groq. The key is **never** synced
to other devices and is **never** sent anywhere except to Groq as an
`Authorization` header.

## What we do NOT do

- We do **not** run any analytics, tracking, or telemetry.
- We do **not** have our own servers; the extension talks only to Groq.
- We do **not** collect, store, or transmit your browsing history.
- We do **not** read or transmit page content unless you select it and trigger an
  action (on LinkedIn, post text is extracted only for the Comment Mode feature,
  and only while you are using it).
- We do **not** sell or share your data with anyone.

## Third-party processing (Groq)

Text you process is handled by Groq under their own terms and privacy policy.
Please review them:

- Groq Privacy Policy: https://groq.com/privacy-policy/
- Groq Terms: https://groq.com/terms-of-use/

## Your control

- You can delete your API key at any time from the extension's Settings page.
- Removing the extension deletes all locally stored data (key and settings).
- No data persists outside your browser and Groq.

## Contact

For questions about this policy, contact the developer at the address listed on
the extension's store page.
