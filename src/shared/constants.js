export const ACTIONS = {
  IMPROVE_WRITING: 'improve_writing',
  FIX_GRAMMAR: 'fix_grammar',
  PROFESSIONAL_TONE: 'professional_tone',
  FRIENDLY_TONE: 'friendly_tone',
  SHORTEN: 'shorten',
  EXPAND: 'expand',
  FRANK_TONE: 'frank_tone',
  HARVEY_TONE: 'harvey_tone',
};

export const COMMENT_ACTIONS = {
  AGREE_AND_ADD: 'agree_and_add',
  RESPECTFUL_CHALLENGE: 'respectful_challenge',
  ASK_A_QUESTION: 'ask_a_question',
  SHARE_EXPERIENCE: 'share_experience',
  ADD_INSIGHT: 'add_insight',
  BE_SUPPORTIVE: 'be_supportive',
  PROFESSIONAL: 'professional_comment',
};

export const MESSAGE_TYPES = {
  GET_SELECTION: 'GET_SELECTION',
  REPLACE_SELECTION: 'REPLACE_SELECTION',
  INSERT_TEXT: 'INSERT_TEXT',
  PROCESS_TEXT: 'PROCESS_TEXT',
  VALIDATE_KEY: 'VALIDATE_KEY',
  EXTRACT_POST_CONTENT: 'EXTRACT_POST_CONTENT',
};

export const MODELS = [
  { id: 'llama-3.1-8b-instant', name: 'LLaMA 3.1 8B (Fast)' },
  { id: 'llama-3.3-70b-versatile', name: 'LLaMA 3.3 70B (Quality)' },
  { id: 'llama-3.1-70b-versatile', name: 'LLaMA 3.1 70B' },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
  { id: 'gemma2-9b-it', name: 'Gemma 2 9B' },
];

export const DEFAULT_SETTINGS = {
  model: 'llama-3.1-8b-instant',
  temperature: 0.7,
  maxTokens: 1024,
  defaultTone: 'professional',
  responseLength: 'medium',
};

export const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const MAX_TEXT_LENGTH = 8000;
