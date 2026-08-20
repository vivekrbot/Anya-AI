export const ACTIONS = {
  IMPROVE_WRITING: 'improve_writing',
  FIX_GRAMMAR: 'fix_grammar',
  PROFESSIONAL_TONE: 'professional_tone',
  FRIENDLY_TONE: 'friendly_tone',
  SHORTEN: 'shorten',
  EXPAND: 'expand',
  FRANK_TONE: 'frank_tone',
  HARVEY_TONE: 'harvey_tone',
  AI_SUGGEST: 'ai_suggest',
  REFINE_PROMPT: 'refine_prompt',
  REFINE_PROMPT_IMAGE: 'refine_prompt_image',
};

export const COMMENT_ACTIONS = {
  AGREE_AND_ADD: 'agree_and_add',
  RESPECTFUL_CHALLENGE: 'respectful_challenge',
  ASK_A_QUESTION: 'ask_a_question',
  SHARE_EXPERIENCE: 'share_experience',
  ADD_INSIGHT: 'add_insight',
  BE_SUPPORTIVE: 'be_supportive',
  PROFESSIONAL: 'professional_comment',
  CONGRATULATE: 'congratulate',
  HOT_TAKE: 'hot_take',
  STORYTELLING: 'storytelling',
  OFFER_HELP: 'offer_help',
  ONE_LINER: 'one_liner',
};

export const MESSAGE_TYPES = {
  GET_SELECTION: 'GET_SELECTION',
  REPLACE_SELECTION: 'REPLACE_SELECTION',
  INSERT_TEXT: 'INSERT_TEXT',
  PROCESS_TEXT: 'PROCESS_TEXT',
  VALIDATE_KEY: 'VALIDATE_KEY',
  EXTRACT_POST_CONTENT: 'EXTRACT_POST_CONTENT',
};

// GroqCloud production models. Verified against
// https://console.groq.com/docs/models (Aug 2026).
export const MODELS = [
  { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B (Fast)' },
  { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B (Quality)' },
  { id: 'qwen/qwen3.6-27b', name: 'Qwen 3.6 27B (Balanced)' },
];

// Models Groq has decommissioned. Requests using these fail with a 404, so any
// saved setting pointing at one is rewritten to its replacement on read.
// See https://console.groq.com/docs/deprecations.
export const LEGACY_MODEL_MAP = {
  'llama-3.1-8b-instant': 'openai/gpt-oss-20b',
  'llama-3.3-70b-versatile': 'openai/gpt-oss-120b',
  'llama-3.1-70b-versatile': 'openai/gpt-oss-120b',
  'mixtral-8x7b-32768': 'openai/gpt-oss-120b',
  'gemma2-9b-it': 'openai/gpt-oss-20b',
  'qwen/qwen3-32b': 'openai/gpt-oss-120b',
  'meta-llama/llama-4-scout-17b-16e-instruct': 'openai/gpt-oss-120b',
};

export const DEFAULT_SETTINGS = {
  model: 'openai/gpt-oss-20b',
  temperature: 0.7,
  maxTokens: 1024,
  defaultTone: 'professional',
  responseLength: 'medium',
};

export const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Cheapest/fastest production model — used only for the "Test key" round trip.
export const VALIDATION_MODEL = 'openai/gpt-oss-20b';

export const MAX_TEXT_LENGTH = 8000;
