export function sendToBackground(type, payload = {}) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type, ...payload }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

export async function sendToContentScript(tabId, type, payload = {}) {
  const response = await chrome.tabs.sendMessage(tabId, { type, ...payload });
  return response;
}

export function onMessage(handler) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const result = handler(message, sender);
    if (result instanceof Promise) {
      result.then(sendResponse).catch((err) => {
        sendResponse({ error: err.message });
      });
      return true; // keep channel open for async response
    }
    sendResponse(result);
    return false;
  });
}
