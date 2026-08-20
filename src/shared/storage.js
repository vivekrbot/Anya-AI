import { DEFAULT_SETTINGS, LEGACY_MODEL_MAP, MODELS } from './constants.js';

const VALID_MODEL_IDS = MODELS.map((m) => m.id);

// Saved settings outlive model lifecycles: a stored `model` may name something
// Groq has since decommissioned, which fails every request with a 404. Map the
// known retirements to their replacements and fall back to the default for
// anything else we no longer recognize.
function migrateModel(model) {
  if (VALID_MODEL_IDS.indexOf(model) !== -1) return model;
  return LEGACY_MODEL_MAP[model] || DEFAULT_SETTINGS.model;
}

export async function getApiKey() {
  const result = await chrome.storage.local.get('apiKey');
  return result.apiKey || '';
}

export async function saveApiKey(key) {
  await chrome.storage.local.set({ apiKey: key });
}

export async function getSettings() {
  const result = await chrome.storage.sync.get('settings');
  const settings = { ...DEFAULT_SETTINGS, ...(result.settings || {}) };
  const model = migrateModel(settings.model);

  if (model !== settings.model) {
    settings.model = model;
    // Persist so the options page shows the migrated choice too.
    await chrome.storage.sync.set({ settings });
  }

  return settings;
}

export async function saveSettings(settings) {
  const current = await getSettings();
  await chrome.storage.sync.set({ settings: { ...current, ...settings } });
}
