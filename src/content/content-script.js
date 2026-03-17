// Guard against double-injection (manifest + programmatic)
if (!window.__anyaAiLoaded) {
  window.__anyaAiLoaded = true;

  let cachedSelection = '';
  let cachedRange = null;
  let selectionIsInInput = false;
  let cachedInputEl = null;
  let cachedSelStart = 0;
  let cachedSelEnd = 0;

  function isEditableElement(el) {
    if (!el) return false;
    const tag = el.tagName;
    if (tag === 'TEXTAREA' || tag === 'INPUT') return true;
    if (el.isContentEditable) return true;
    return false;
  }

  function captureSelection() {
    const selection = window.getSelection();
    const text = selection ? selection.toString().trim() : '';
    if (text) {
      cachedSelection = text;
      if (selection.rangeCount > 0) {
        cachedRange = selection.getRangeAt(0).cloneRange();
      }
      const anchorNode = selection.anchorNode;
      const el = anchorNode
        ? anchorNode.nodeType === Node.ELEMENT_NODE
          ? anchorNode
          : anchorNode.parentElement
        : null;
      selectionIsInInput = isEditableElement(el);

      // Cache the actual input/textarea element and its selection offsets
      if (el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT')) {
        cachedInputEl = el;
        cachedSelStart = el.selectionStart;
        cachedSelEnd = el.selectionEnd;
      } else if (el && el.closest && el.closest('[contenteditable="true"]')) {
        cachedInputEl = el.closest('[contenteditable="true"]');
        cachedSelStart = 0;
        cachedSelEnd = 0;
      } else {
        cachedInputEl = null;
        cachedSelStart = 0;
        cachedSelEnd = 0;
      }

      // Push selection update to side panel in real-time
      chrome.runtime.sendMessage({
        type: 'SELECTION_UPDATED',
        text: cachedSelection,
        isInInput: selectionIsInInput,
      }).catch(function(e) {
        // Side panel not open or no listeners — ignore
      });
    }
  }

  document.addEventListener('mouseup', captureSelection);
  document.addEventListener('keyup', (e) => {
    if (
      e.key === 'Shift' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.key === 'Home' ||
      e.key === 'End'
    ) {
      captureSelection();
    }
  });

  function replaceInTextInput(element, start, end, newText) {
    element.focus();
    const value = element.value;
    element.value = value.substring(0, start) + newText + value.substring(end);
    element.selectionStart = start;
    element.selectionEnd = start + newText.length;
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function replaceWithRange(editableEl, range, newText) {
    if (editableEl) editableEl.focus();
    range.deleteContents();
    const textNode = document.createTextNode(newText);
    range.insertNode(textNode);
    const sel = window.getSelection();
    sel.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(textNode);
    sel.addRange(newRange);
  }

  function insertInTextInput(element, position, newText) {
    element.focus();
    const value = element.value;
    element.value = value.substring(0, position) + newText + value.substring(position);
    element.selectionStart = position;
    element.selectionEnd = position + newText.length;
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function insertInContentEditable(editableEl, newText) {
    if (editableEl) editableEl.focus();
    if (cachedRange) {
      const range = cachedRange.cloneRange();
      range.collapse(false);
      const textNode = document.createTextNode(newText);
      range.insertNode(textNode);
    }
  }

  // Direct listener — only handle messages meant for content script.
  // Do NOT call sendResponse for unrecognized messages so other
  // listeners (service worker) can handle them.
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_SELECTION') {
      sendResponse({
        text: cachedSelection,
        isInInput: selectionIsInInput,
      });
      return false;
    }

    if (message.type === 'REPLACE_SELECTION') {
      try {
        if (!cachedInputEl && !cachedRange) {
          sendResponse({ error: 'No selection to replace.' });
          return false;
        }

        if (cachedInputEl && (cachedInputEl.tagName === 'TEXTAREA' || cachedInputEl.tagName === 'INPUT')) {
          replaceInTextInput(cachedInputEl, cachedSelStart, cachedSelEnd, message.text);
        } else if (cachedInputEl && cachedInputEl.isContentEditable) {
          replaceWithRange(cachedInputEl, cachedRange, message.text);
        } else {
          sendResponse({ error: 'NOT_EDITABLE' });
          return false;
        }
        sendResponse({ success: true });
      } catch (err) {
        sendResponse({ error: err.message });
      }
      return false;
    }

    if (message.type === 'INSERT_TEXT') {
      try {
        if (!cachedInputEl) {
          sendResponse({ error: 'NOT_EDITABLE' });
          return false;
        }

        if (cachedInputEl.tagName === 'TEXTAREA' || cachedInputEl.tagName === 'INPUT') {
          insertInTextInput(cachedInputEl, cachedSelEnd, message.text);
        } else if (cachedInputEl.isContentEditable) {
          insertInContentEditable(cachedInputEl, message.text);
        } else {
          sendResponse({ error: 'NOT_EDITABLE' });
          return false;
        }
        sendResponse({ success: true });
      } catch (err) {
        sendResponse({ error: err.message });
      }
      return false;
    }

    // Unknown message — don't respond, let other listeners handle it
    return false;
  });
}
