import { MESSAGE_TYPES, MAX_TEXT_LENGTH } from '../shared/constants.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

let currentTabId = null;
let currentResult = '';
let isInInput = false;
let selectedCommentAction = null;
let commentPostContent = '';

// DOM references
const selectedTextEl = $('#selectedText');
const commentModeToggle = $('#commentModeToggle');
const resultPanel = $('#resultPanel');
const resultText = $('#resultText');
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
      selectedTextEl.value = response.text;
      isInInput = response.isInInput || false;
    }
  } catch (e) {
    // Content script not available on this page
  }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', fetchSelection);

// Re-fetch selection when the active tab changes (side panel stays open)
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  currentTabId = activeInfo.tabId;
  selectedTextEl.value = '';
  commentPostContent = '';
  postContentText.textContent = 'Text Placeholder here...';
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
    selectedTextEl.value = message.text;
    isInInput = message.isInInput || false;
    // Also update comment mode content if toggle is on
    if (commentModeToggle.checked) {
      commentPostContent = message.text;
      postContentText.textContent = message.text;
    }
  }
  if (message.type === 'POST_CONTENT_UPDATED' && message.text) {
    commentPostContent = message.text;
    postContentText.textContent = message.text;
  }
});

// Clear button
$('#btnClear').addEventListener('click', () => {
  selectedTextEl.value = '';
  isInInput = false;
  hideError();
  hideResult();
});

// Refresh button
$('#btnRefresh').addEventListener('click', () => {
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
  extractPostContent();
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

// Extract post content from page (LinkedIn or fallback to selection)
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
      postContentText.textContent = response.text;
    } else {
      postContentText.textContent = 'No post content found. Select text on the page and click Refresh.';
    }
  } catch (e) {
    // Fallback: try selected text
    try {
      const selResponse = await chrome.tabs.sendMessage(currentTabId, {
        type: MESSAGE_TYPES.GET_SELECTION,
      });
      if (selResponse && selResponse.text) {
        commentPostContent = selResponse.text;
        postContentText.textContent = selResponse.text;
      } else {
        postContentText.textContent = 'No content found. Select text on the page and click Refresh.';
      }
    } catch (e2) {
      postContentText.textContent = 'No content found. Select text on the page and click Refresh.';
    }
  }
}

// Generate comment via AI
async function generateComment() {
  if (!commentPostContent) {
    showError('No content to comment on. Extract or select post content first.');
    return;
  }
  if (!selectedCommentAction) {
    showError('Select a comment mode first.');
    return;
  }
  if (commentPostContent.length > MAX_TEXT_LENGTH) {
    showError(
      `Post content is too long (${commentPostContent.length} chars). Maximum is ${MAX_TEXT_LENGTH} characters.`
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

// Action buttons
$$('.action-btn').forEach((btn) => {
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
      currentResult = response.result;
      showResult(response.result);
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

function showResult(text) {
  resultText.textContent = text;
  resultPanel.classList.remove('hidden');
  resultPanel.scrollIntoView({ behavior: 'smooth' });
}

function hideResult() {
  resultPanel.classList.add('hidden');
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
  $$('.action-btn').forEach((btn) => {
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
