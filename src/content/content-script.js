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

  // --- LinkedIn / Social Post Extraction (class-name-independent) ---

  // Find the post container by walking up from an element
  function findPostContainer(el) {
    if (!el) return null;
    let current = el;
    while (current && current !== document.body) {
      // Primary: LinkedIn uses data-urn on post containers
      if (current.hasAttribute('data-urn')) {
        const urn = current.getAttribute('data-urn');
        if (urn.includes('activity') || urn.includes('ugcPost') || urn.includes('share')) {
          return current;
        }
      }
      // Secondary: article elements are common post wrappers
      if (current.tagName === 'ARTICLE') {
        return current;
      }
      current = current.parentElement;
    }
    // Tertiary: walk up again looking for a medium-sized container with text
    current = el;
    while (current && current !== document.body) {
      const rect = current.getBoundingClientRect();
      if (rect.height > 200 && rect.height < 3000 && rect.width > 250) {
        const textLen = (current.innerText || '').length;
        if (textLen > 80 && textLen < 15000) {
          return current;
        }
      }
      current = current.parentElement;
    }
    return null;
  }

  // Extract the main post text from a container (skip comments, buttons, inputs)
  function extractPostText(container) {
    // Strategy A: collect text from span[dir="ltr"] — LinkedIn wraps post body in these
    const ltrSpans = container.querySelectorAll('span[dir="ltr"]');
    let bestLtr = '';
    for (const span of ltrSpans) {
      // Skip spans inside comment areas or editable inputs
      if (span.closest('[contenteditable="true"]')) continue;
      if (span.closest('[role="textbox"]')) continue;
      if (span.closest('button')) continue;
      const t = (span.innerText || span.textContent || '').trim();
      if (t.length > bestLtr.length) bestLtr = t;
    }
    if (bestLtr.length > 40) return bestLtr;

    // Strategy B: find the largest text block in div/p/span elements
    let bestBlock = '';
    const blocks = container.querySelectorAll('div, p, span, article');
    for (const block of blocks) {
      if (block.closest('[contenteditable="true"]')) continue;
      if (block.closest('[role="textbox"]')) continue;
      if (block.closest('button')) continue;
      // Skip elements that are mostly interactive (many buttons/links relative to text)
      const btnCount = block.querySelectorAll('button, a').length;
      if (btnCount > 5 && block.children.length > 0) continue;
      const t = (block.innerText || '').trim();
      // Must be substantial text but not the entire page
      if (t.length > 40 && t.length < 5000 && t.length > bestBlock.length) {
        bestBlock = t;
      }
    }
    return bestBlock;
  }

  function cleanPostText(text) {
    if (!text) return '';
    // Remove "...see more" / "…more"
    text = text.replace(/…\s*(see more|more)\s*$/i, '');
    text = text.replace(/\.\.\.\s*(see more|more)\s*$/i, '');
    // Remove engagement lines
    text = text.replace(/^\s*(liked by|loves?|celebrates?|insightful|funny|repost)\b.*$/gim, '');
    // Remove repost headers
    text = text.replace(/^\w+.*reposted\s*(this)?\s*/i, '');
    // Remove hashtag spam at the end
    text = text.replace(/(#\w+\s*){4,}$/, '');
    // Clean whitespace
    text = text.replace(/\n{3,}/g, '\n\n').trim();
    return text;
  }

  // Cache the last extracted post so the side panel can retrieve it
  let lastExtractedPost = '';

  function extractLinkedInPostContent() {
    const hostname = window.location.hostname;
    if (!hostname.includes('linkedin.com')) {
      return { text: '' };
    }

    // Strategy 1: find post from the currently focused/active element
    const activeEl = document.activeElement;
    if (activeEl) {
      const container = findPostContainer(activeEl);
      if (container) {
        const text = cleanPostText(extractPostText(container));
        if (text) {
          lastExtractedPost = text;
          return { text };
        }
      }
    }

    // Strategy 2: find ALL contenteditable elements (comment inputs) and walk up
    const editables = document.querySelectorAll('[contenteditable="true"], [role="textbox"]');
    for (let i = editables.length - 1; i >= 0; i--) {
      const container = findPostContainer(editables[i]);
      if (container) {
        const text = cleanPostText(extractPostText(container));
        if (text) {
          lastExtractedPost = text;
          return { text };
        }
      }
    }

    // Strategy 3: first visible post in the viewport
    const allUrns = document.querySelectorAll('[data-urn]');
    for (const el of allUrns) {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0 && rect.height > 150) {
        const text = cleanPostText(extractPostText(el));
        if (text) {
          lastExtractedPost = text;
          return { text };
        }
      }
    }

    // Strategy 4: any visible article element
    const articles = document.querySelectorAll('article');
    for (const article of articles) {
      const rect = article.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        const text = cleanPostText(extractPostText(article));
        if (text) {
          lastExtractedPost = text;
          return { text };
        }
      }
    }

    // Return cached if all strategies fail
    if (lastExtractedPost) return { text: lastExtractedPost };
    return { text: '' };
  }

  function notifyPostContent(text) {
    chrome.runtime.sendMessage({
      type: 'POST_CONTENT_UPDATED',
      text: text,
    }).catch(function() {});
  }

  // --- Auto-detection on LinkedIn ---
  if (window.location.hostname.includes('linkedin.com')) {
    // 1. Detect focus on ANY editable element (comment boxes, reply inputs)
    document.addEventListener('focusin', (e) => {
      const el = e.target;
      if (el.getAttribute('contenteditable') === 'true' ||
          el.getAttribute('role') === 'textbox' ||
          el.tagName === 'TEXTAREA') {
        // Delay slightly so LinkedIn's DOM settles after clicking Comment
        setTimeout(() => {
          const result = extractLinkedInPostContent();
          if (result.text) notifyPostContent(result.text);
        }, 300);
      }
    });

    // 2. Watch for new contenteditable elements being added (comment box appearing)
    let observerTimer = null;
    const postObserver = new MutationObserver((mutations) => {
      // Throttle: only process once per 500ms to avoid perf issues on busy pages
      if (observerTimer) return;
      let found = false;
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          const hasEditable = (node.getAttribute && node.getAttribute('contenteditable') === 'true') ||
                              (node.querySelector && node.querySelector('[contenteditable="true"], [role="textbox"]'));
          if (hasEditable) { found = true; break; }
        }
        if (found) break;
      }
      if (found) {
        observerTimer = setTimeout(() => {
          observerTimer = null;
          const result = extractLinkedInPostContent();
          if (result.text) notifyPostContent(result.text);
        }, 500);
      }
    });
    postObserver.observe(document.body, { childList: true, subtree: true });
  }

  // Direct listener — only handle messages meant for content script.
  // Do NOT call sendResponse for unrecognized messages so other
  // listeners (service worker) can handle them.
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'EXTRACT_POST_CONTENT') {
      const result = extractLinkedInPostContent();
      if (!result.text && cachedSelection) {
        sendResponse({ text: cachedSelection });
      } else {
        sendResponse(result);
      }
      return false;
    }

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
