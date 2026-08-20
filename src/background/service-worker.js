import {
  MESSAGE_TYPES,
  GROQ_API_URL,
  MAX_TEXT_LENGTH,
  VALIDATION_MODEL,
} from '../shared/constants.js';
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

// The gpt-oss models reason before answering. These are short rewrite tasks, so
// keep reasoning minimal and out of the response — otherwise it eats the
// max_tokens budget and can leak into the text we paste back.
function buildRequestBody(model, messages, temperature, maxTokens) {
  const body = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  if (model.indexOf('openai/gpt-oss') === 0) {
    body.reasoning_effort = 'low';
    body.include_reasoning = false;
  } else if (model.indexOf('qwen/') === 0) {
    body.reasoning_format = 'hidden';
  }

  return body;
}

async function callGroqAPI(apiKey, model, messages, temperature, maxTokens) {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(buildRequestBody(model, messages, temperature, maxTokens)),
  });

  if (!response.ok) {
    const status = response.status;
    if (status === 401)
      throw new Error('Invalid API key. Please check your Groq API key in Settings.');
    if (status === 429)
      throw new Error('Rate limited. Please wait a moment and try again.');
    if (status === 404)
      throw new Error(
        'Model "' + model + '" is no longer available on Groq. Open Settings and pick a current model.'
      );
    if (status === 503)
      throw new Error('Groq service is temporarily unavailable. Please try again.');
    throw new Error('API error (' + status + '). Please try again.');
  }

  const data = await response.json();
  const content =
    data && data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : null;
  if (typeof content !== 'string') {
    throw new Error('Unexpected response from Groq. Please try again.');
  }
  return content.trim();
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
  // Only accept messages originating from this extension (own side panel,
  // options page, or content scripts). Rejects anything else.
  if (sender.id !== chrome.runtime.id) {
    return false;
  }

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
          VALIDATION_MODEL,
          [{ role: 'user', content: 'Hi' }],
          0.1,
          // Enough headroom that reasoning tokens can't truncate the reply to
          // nothing and make a valid key look broken.
          64
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
