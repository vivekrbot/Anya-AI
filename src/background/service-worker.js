import { MESSAGE_TYPES, GROQ_API_URL, MAX_TEXT_LENGTH } from '../shared/constants.js';
import { getApiKey, getSettings } from '../shared/storage.js';
import { buildPrompt, buildCommentPrompt } from '../shared/prompts.js';

// Inject content script into the active tab (idempotent — guarded in content-script.js)
async function ensureContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content/content-script.js'],
    });
  } catch (e) {
    // Cannot inject on chrome://, edge://, extension pages, etc.
  }
}

// Open side panel on extension icon click
if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
}

// Also inject content script when icon is clicked
chrome.action.onClicked.addListener(async (tab) => {
  try {
    await ensureContentScript(tab.id);
  } catch (e) {
    // Ignore injection failures
  }
});

async function callGroqAPI(apiKey, model, messages, temperature, maxTokens) {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const status = response.status;
    if (status === 401)
      throw new Error('Invalid API key. Please check your Groq API key in Settings.');
    if (status === 429)
      throw new Error('Rate limited. Please wait a moment and try again.');
    if (status === 503)
      throw new Error('Groq service is temporarily unavailable. Please try again.');
    throw new Error('API error (' + status + '). Please try again.');
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

async function processWithRetry(apiKey, model, messages, temperature, maxTokens, retries) {
  retries = retries || 2;
  for (var i = 0; i <= retries; i++) {
    try {
      return await callGroqAPI(apiKey, model, messages, temperature, maxTokens);
    } catch (err) {
      var isRetryable = err.message.indexOf('503') !== -1 || err.message.indexOf('Rate limited') !== -1;
      if (i < retries && isRetryable) {
        await new Promise(function (r) { setTimeout(r, 1000 * (i + 1)); });
        continue;
      }
      throw err;
    }
  }
}

// Handle messages — only respond to messages meant for the service worker
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  // Ignore messages not meant for the service worker
  if (
    message.type === 'SELECTION_UPDATED' ||
    message.type === 'POST_CONTENT_UPDATED' ||
    message.type === MESSAGE_TYPES.GET_SELECTION ||
    message.type === MESSAGE_TYPES.REPLACE_SELECTION ||
    message.type === MESSAGE_TYPES.INSERT_TEXT ||
    message.type === MESSAGE_TYPES.EXTRACT_POST_CONTENT
  ) {
    return false;
  }

  if (message.type === MESSAGE_TYPES.PROCESS_TEXT) {
    (async function () {
      try {
        if (!message.text || typeof message.text !== 'string') {
          sendResponse({ error: 'No text provided.' });
          return;
        }
        if (message.text.length > MAX_TEXT_LENGTH) {
          sendResponse({ error: 'Text exceeds maximum length (' + MAX_TEXT_LENGTH + ' chars).' });
          return;
        }

        var apiKey = await getApiKey();
        if (!apiKey) {
          sendResponse({
            error: 'No API key configured. Please add your Groq API key in Settings.',
          });
          return;
        }

        var settings = await getSettings();
        var prompt;
        if (message.commentAction) {
          prompt = buildCommentPrompt(message.action, message.text, {
            tone: message.tone || 'auto',
            length: message.length || 'auto',
          });
        } else {
          prompt = buildPrompt(message.action, message.text, {
            commentMode: message.commentMode || false,
            isInInput: message.isInInput || false,
          });
        }

        var msgs = [
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user },
        ];

        var result = await processWithRetry(
          apiKey,
          settings.model,
          msgs,
          settings.temperature,
          settings.maxTokens
        );
        sendResponse({ result: result });
      } catch (err) {
        sendResponse({ error: err.message });
      }
    })();
    return true; // keep channel open for async response
  }

  if (message.type === MESSAGE_TYPES.VALIDATE_KEY) {
    (async function () {
      try {
        await callGroqAPI(
          message.key,
          'llama-3.1-8b-instant',
          [{ role: 'user', content: 'Hi' }],
          0.1,
          5
        );
        sendResponse({ valid: true });
      } catch (err) {
        sendResponse({ valid: false, error: err.message });
      }
    })();
    return true; // keep channel open for async response
  }

  return false;
});
