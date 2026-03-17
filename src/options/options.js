import { MODELS, MESSAGE_TYPES } from '../shared/constants.js';
import { getApiKey, saveApiKey, getSettings, saveSettings } from '../shared/storage.js';
import { sendToBackground } from '../shared/messaging.js';

const $ = (sel) => document.querySelector(sel);

// DOM refs
const apiKeyInput = $('#apiKey');
const modelSelect = $('#model');
const temperatureInput = $('#temperature');
const tempValue = $('#tempValue');
const responseLengthSelect = $('#responseLength');
const defaultToneSelect = $('#defaultTone');
const keyStatus = $('#keyStatus');
const settingsStatus = $('#settingsStatus');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Populate model dropdown
  MODELS.forEach((m) => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = m.name;
    modelSelect.appendChild(opt);
  });

  // Load saved values
  const apiKey = await getApiKey();
  if (apiKey) {
    apiKeyInput.value = apiKey;
  }

  const settings = await getSettings();
  modelSelect.value = settings.model;
  temperatureInput.value = settings.temperature;
  tempValue.textContent = settings.temperature;
  responseLengthSelect.value = settings.responseLength;
  defaultToneSelect.value = settings.defaultTone;
});

// Temperature slider
temperatureInput.addEventListener('input', () => {
  tempValue.textContent = temperatureInput.value;
});

// Toggle key visibility
$('#btnToggleKey').addEventListener('click', () => {
  const isPassword = apiKeyInput.type === 'password';
  apiKeyInput.type = isPassword ? 'text' : 'password';
  $('#btnToggleKey .material-symbols-outlined').textContent = isPassword ? 'visibility_off' : 'visibility';
});

// Save API key
$('#btnSaveKey').addEventListener('click', async () => {
  const key = apiKeyInput.value.trim();
  if (!key) {
    showStatus(keyStatus, 'Please enter an API key.', 'error');
    return;
  }
  await saveApiKey(key);
  showStatus(keyStatus, 'API key saved.', 'success');
});

// Test API key
$('#btnTestKey').addEventListener('click', async () => {
  const key = apiKeyInput.value.trim();
  if (!key) {
    showStatus(keyStatus, 'Please enter an API key first.', 'error');
    return;
  }

  showStatus(keyStatus, 'Testing...', 'success');

  try {
    const response = await sendToBackground(MESSAGE_TYPES.VALIDATE_KEY, { key });
    if (response.valid) {
      showStatus(keyStatus, 'API key is valid!', 'success');
    } else {
      showStatus(keyStatus, response.error || 'Invalid API key.', 'error');
    }
  } catch (e) {
    showStatus(keyStatus, 'Could not test key. Please try again.', 'error');
  }
});

// Save settings
$('#btnSaveSettings').addEventListener('click', async () => {
  await saveSettings({
    model: modelSelect.value,
    temperature: parseFloat(temperatureInput.value),
    responseLength: responseLengthSelect.value,
    defaultTone: defaultToneSelect.value,
  });
  showStatus(settingsStatus, 'Settings saved.', 'success');
});

function showStatus(el, message, type) {
  el.textContent = message;
  el.className = `status ${type}`;
  el.classList.remove('hidden');
  if (type !== 'error') {
    setTimeout(() => el.classList.add('hidden'), 3000);
  }
}
