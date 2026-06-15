import { MESSAGE_TYPES, MAX_TEXT_LENGTH } from '../shared/constants.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

let currentTabId = null;
let currentResult = '';
let isInInput = false;
let selectedCommentAction = null;
let commentPostContent = '';
// Track what we last populated from a page selection. If the textarea later
// shows a DIFFERENT non-empty value, the user has typed/edited and we should
// not overwrite their work.
let lastPageSelection = '';

// DOM references
const selectedTextEl = $('#selectedText');
const commentModeToggle = $('#commentModeToggle');
const resultPanel = $('#resultPanel');
const resultText = $('#resultText');
const resultNote = $('#resultNote');
const loadingOverlay = $('#loadingOverlay');
const errorMessage = $('#errorMessage');
const writingView = $('#writingView');
const commentView = $('#commentView');
const postContentText = $('#postContentText');
const commentResultPanel = $('#commentResultPanel');
const commentResultText = $('#commentResultText');
const generateSection = $('#generateSection');

// Inject content script into tab (idempotent — guarded in content-script.js)
async function ensureContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content/content-script.js'],
    });
  } catch (e) {
    // Cannot inject on chrome://, extension pages, etc.
  }
}

// Get the active tab
async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab || null;
}

// Fetch selected text from the active tab's content script
async function fetchSelection() {
  try {
    const tab = await getActiveTab();
    if (!tab || !tab.id) return;
    currentTabId = tab.id;

    // Ensure content script is injected first
    await ensureContentScript(currentTabId);

    // Small delay to let the content script initialize
    await new Promise((r) => setTimeout(r, 100));

    const response = await chrome.tabs.sendMessage(currentTabId, {
      type: MESSAGE_TYPES.GET_SELECTION,
    });
    if (response && response.text) {
      applyPageSelection(response.text, response.isInInput);
    }
  } catch (e) {
    // Content script not available on this page
  }
}

// Populate the textarea from a page selection, but only if the user hasn't
// typed something different into it.
function applyPageSelection(text, inInput) {
  const current = selectedTextEl.value;
  if (current && current !== lastPageSelection) {
    // User has edited the textarea — leave it alone
    return;
  }
  selectedTextEl.value = text;
  lastPageSelection = text;
  isInInput = !!inInput;
}

// Initialize on load
document.addEventListener('DOMContentLoaded', fetchSelection);

// Re-fetch selection when the active tab changes (side panel stays open)
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  currentTabId = activeInfo.tabId;
  selectedTextEl.value = '';
  lastPageSelection = '';
  commentPostContent = '';
  postContentText.value = '';
  resetCommentResult();
  await fetchSelection();
  if (commentModeToggle.checked) {
    extractPostContent();
  }
});

// Also handle tab URL changes (navigation within the same tab)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (tabId === currentTabId && changeInfo.status === 'complete') {
    await fetchSelection();
  }
});

// Listen for selection updates pushed from content script in real-time
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'SELECTION_UPDATED' && message.text) {
    applyPageSelection(message.text, message.isInInput);
    // Also update comment mode content if toggle is on
    if (commentModeToggle.checked) {
      const isNewContent = message.text !== commentPostContent;
      commentPostContent = message.text;
      postContentText.value = message.text;
      if (isNewContent) resetCommentResult();
    }
  }
  if (message.type === 'POST_CONTENT_UPDATED' && message.text) {
    const isNewContent = message.text !== commentPostContent;
    commentPostContent = message.text;
    postContentText.value = message.text;
    if (isNewContent) resetCommentResult();
  }
});

// Fallback paths: re-fetch the current selection when the side panel gains
// focus or becomes visible. Covers cases where the realtime push from the
// content script was missed (e.g. panel was hidden/unfocused at the moment).
window.addEventListener('focus', () => {
  fetchSelection();
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    fetchSelection();
  }
});
// Also periodically poll so a missed push doesn't leave the panel stale.
setInterval(() => {
  // Only poll if the textarea is empty or hasn't been edited by the user.
  if (!selectedTextEl.value || selectedTextEl.value === lastPageSelection) {
    fetchSelection();
  }
}, 1500);

// Clear button
$('#btnClear').addEventListener('click', () => {
  selectedTextEl.value = '';
  lastPageSelection = '';
  isInInput = false;
  hideError();
  hideResult();
});

// Refresh button — re-fetch page selection, overriding any typed content
$('#btnRefresh').addEventListener('click', () => {
  selectedTextEl.value = '';
  lastPageSelection = '';
  fetchSelection();
});

// --- Comment Mode Toggle ---
commentModeToggle.addEventListener('change', () => {
  if (commentModeToggle.checked) {
    writingView.classList.add('hidden');
    commentView.classList.remove('hidden');
    hideError();
    hideResult();
    extractPostContent();
  } else {
    writingView.classList.remove('hidden');
    commentView.classList.add('hidden');
    hideError();
    resetCommentResult();
  }
});

// --- Comment Mode Action Buttons (radio-style selection) ---
$$('.comment-action-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    $$('.comment-action-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    selectedCommentAction = btn.dataset.commentAction;
    // Reset result when changing mode
    resetCommentResult();
    hideError();
  });
});

// Refresh post content
$('#btnRefreshPost').addEventListener('click', () => {
  resetCommentResult();
  extractPostContent();
});

// Clear post content
$('#btnClearPost').addEventListener('click', () => {
  commentPostContent = '';
  postContentText.value = '';
  resetCommentResult();
  hideError();
  postContentText.focus();
});

// Keep commentPostContent in sync when user types/pastes directly
postContentText.addEventListener('input', () => {
  commentPostContent = postContentText.value;
});

// Generate Comment
$('#btnGenerateComment').addEventListener('click', () => {
  generateComment();
});

// Insert comment into the page's active input/comment box
$('#btnInsertComment').addEventListener('click', async () => {
  const text = commentResultText.value.trim();
  if (!text || !currentTabId) return;
  try {
    const res = await chrome.tabs.sendMessage(currentTabId, {
      type: MESSAGE_TYPES.INSERT_TEXT,
      text,
    });
    if (res && res.error === 'NOT_EDITABLE') {
      showError('Cannot insert — place your cursor in a text field or comment box first.');
      return;
    }
    if (res && res.error) {
      showError(res.error);
      return;
    }
  } catch (e) {
    showError('Could not insert text on this page.');
  }
});

// Copy comment result
$('#btnCopyComment').addEventListener('click', async () => {
  const text = commentResultText.value.trim();
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    const btn = $('#btnCopyComment');
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
  } catch (e) {
    showError('Could not copy to clipboard.');
  }
});

// Try Different — regenerate with same settings
$('#btnTryDifferent').addEventListener('click', () => {
  generateComment();
});

// Extract content from page (selection on any site, LinkedIn post as enhancement)
async function extractPostContent() {
  try {
    const tab = await getActiveTab();
    if (!tab || !tab.id) return;
    currentTabId = tab.id;
    await ensureContentScript(currentTabId);
    await new Promise((r) => setTimeout(r, 100));

    const response = await chrome.tabs.sendMessage(currentTabId, {
      type: MESSAGE_TYPES.EXTRACT_POST_CONTENT,
    });

    if (response && response.text) {
      commentPostContent = response.text;
      postContentText.value = response.text;
    }
  } catch (e) {
    // Content script not available — user can paste manually
  }
}

// Generate comment via AI
async function generateComment() {
  // Read live from the textarea — users can type or paste directly
  const text = postContentText.value.trim();
  commentPostContent = text;
  if (!text) {
    showError('No content to work on. Paste or select content in the CONTENT box first.');
    return;
  }
  if (!selectedCommentAction) {
    showError('Select a mode above first.');
    return;
  }
  if (text.length > MAX_TEXT_LENGTH) {
    showError(
      `Content is too long (${text.length} chars). Maximum is ${MAX_TEXT_LENGTH} characters.`
    );
    return;
  }

  hideError();
  showLoading();
  disableCommentButtons(true);

  const tone = $('#toneSelect').value;
  const length = $('#lengthSelect').value;

  try {
    const response = await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.PROCESS_TEXT,
      action: selectedCommentAction,
      text: commentPostContent,
      commentAction: true,
      tone,
      length,
    });

    if (response && response.error) {
      showError(response.error);
    } else if (response && response.result) {
      commentResultText.value = response.result;
      commentResultPanel.classList.remove('hidden');
      generateSection.classList.add('hidden');
      commentResultPanel.scrollIntoView({ behavior: 'smooth' });
    } else {
      showError('No response from AI. Please try again.');
    }
  } catch (err) {
    showError('Failed to generate comment. Please try again.');
  } finally {
    hideLoading();
    disableCommentButtons(false);
  }
}

function resetCommentResult() {
  commentResultPanel.classList.add('hidden');
  commentResultText.value = '';
  generateSection.classList.remove('hidden');
}

// Action buttons (writing-mode actions + AI Suggest)
$$('.action-btn, .ai-suggest-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action;
    processText(action);
  });
});

// Result buttons
$('#btnReplace').addEventListener('click', async () => {
  if (!currentResult || !currentTabId) return;
  try {
    const res = await chrome.tabs.sendMessage(currentTabId, {
      type: MESSAGE_TYPES.REPLACE_SELECTION,
      text: currentResult,
    });
    if (res && res.error === 'NOT_EDITABLE') {
      showError('Cannot replace — select text inside a text field or editable area.');
      return;
    }
    if (res && res.error) {
      showError(res.error);
      return;
    }
    hideResult();
  } catch (e) {
    showError('Could not replace text on this page.');
  }
});

$('#btnInsert').addEventListener('click', async () => {
  if (!currentResult || !currentTabId) return;
  try {
    const res = await chrome.tabs.sendMessage(currentTabId, {
      type: MESSAGE_TYPES.INSERT_TEXT,
      text: currentResult,
    });
    if (res && res.error === 'NOT_EDITABLE') {
      showError('Cannot insert — place your cursor in a text field or editable area.');
      return;
    }
    if (res && res.error) {
      showError(res.error);
      return;
    }
    hideResult();
  } catch (e) {
    showError('Could not insert text on this page.');
  }
});

$('#btnCopy').addEventListener('click', async () => {
  if (!currentResult) return;
  try {
    await navigator.clipboard.writeText(currentResult);
    const btn = $('#btnCopy');
    const originalHTML = btn.innerHTML;
    btn.innerHTML =
      '<span class="material-symbols-outlined">check</span> Copied!';
    setTimeout(() => {
      btn.innerHTML = originalHTML;
    }, 1500);
  } catch (e) {
    showError('Could not copy to clipboard.');
  }
});

// Settings button
$('#btnSettings').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// Process text with AI
async function processText(action) {
  const text = selectedTextEl.value.trim();
  if (!text) {
    showError('No text selected. Select text on the page first.');
    return;
  }

  if (text.length > MAX_TEXT_LENGTH) {
    showError(
      `Text is too long (${text.length} chars). Maximum is ${MAX_TEXT_LENGTH} characters.`
    );
    return;
  }

  hideError();
  hideResult();
  showLoading();
  disableButtons(true);

  try {
    const response = await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.PROCESS_TEXT,
      action,
      text,
      commentMode: commentModeToggle.checked,
      isInInput,
    });

    if (response && response.error) {
      showError(response.error);
    } else if (response && response.result) {
      // AI Suggest returns "[NOTE]\n...\n[REWRITE]\n..." — parse if present
      const noteMatch = response.result.match(/^\s*\[NOTE\]\s*([\s\S]*?)\s*\[REWRITE\]\s*([\s\S]*)$/);
      if (noteMatch) {
        currentResult = noteMatch[2].trim();
        showResult(currentResult, noteMatch[1].trim());
      } else {
        currentResult = response.result;
        showResult(response.result);
      }
    } else {
      showError('No response from AI. Please try again.');
    }
  } catch (err) {
    showError('Failed to process text. Please try again.');
  } finally {
    hideLoading();
    disableButtons(false);
  }
}

function showResult(text, note) {
  resultText.textContent = text;
  if (note) {
    resultNote.textContent = note;
    resultNote.classList.remove('hidden');
  } else {
    resultNote.textContent = '';
    resultNote.classList.add('hidden');
  }
  resultPanel.classList.remove('hidden');
  resultPanel.scrollIntoView({ behavior: 'smooth' });
}

function hideResult() {
  resultPanel.classList.add('hidden');
  resultNote.textContent = '';
  resultNote.classList.add('hidden');
  currentResult = '';
}

function showLoading() {
  loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
  loadingOverlay.classList.add('hidden');
}

function showError(msg) {
  errorMessage.textContent = msg;
  errorMessage.classList.remove('hidden');
}

function hideError() {
  errorMessage.classList.add('hidden');
}

function disableButtons(disabled) {
  $$('.action-btn, .ai-suggest-btn').forEach((btn) => {
    btn.disabled = disabled;
  });
}

function disableCommentButtons(disabled) {
  $$('.comment-action-btn').forEach((btn) => {
    btn.disabled = disabled;
  });
  const genBtn = $('#btnGenerateComment');
  if (genBtn) genBtn.disabled = disabled;
  const tryBtn = $('#btnTryDifferent');
  if (tryBtn) tryBtn.disabled = disabled;
}
