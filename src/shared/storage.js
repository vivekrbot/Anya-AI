import { DEFAULT_SETTINGS } from './constants.js';

export async function getApiKey() {
  const result = await chrome.storage.local.get('apiKey');
  return result.apiKey || '';
}

export async function saveApiKey(key) {
  await chrome.storage.local.set({ apiKey: key });
}

export async function getSettings() {
  const result = await chrome.storage.sync.get('settings');
  return { ...DEFAULT_SETTINGS, ...(result.settings || {}) };
}

export async function saveSettings(settings) {
  const current = await getSettings();
  await chrome.storage.sync.set({ settings: { ...current, ...settings } });
}
