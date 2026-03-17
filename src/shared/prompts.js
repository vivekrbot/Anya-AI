import { ACTIONS } from './constants.js';

const ACTION_PROMPTS = {
  [ACTIONS.IMPROVE_WRITING]: {
    system: 'You are an expert writing assistant. Improve the clarity, flow, and word choice of the given text while preserving its original meaning and intent. Return only the improved text with no preamble or explanation.',
    instruction: 'Improve the writing of the following text:',
  },
  [ACTIONS.FIX_GRAMMAR]: {
    system: 'You are a grammar and spelling expert. Fix all grammar, spelling, and punctuation errors in the given text. Do not change the meaning, tone, or style — only correct errors. Return only the corrected text with no preamble or explanation.',
    instruction: 'Fix the grammar of the following text:',
  },
  [ACTIONS.PROFESSIONAL_TONE]: {
    system: 'You are a professional communication expert. Rewrite the given text in a formal, business-appropriate tone. Maintain the core message while making it suitable for professional contexts. Return only the rewritten text with no preamble or explanation.',
    instruction: 'Rewrite the following text in a professional tone:',
  },
  [ACTIONS.FRIENDLY_TONE]: {
    system: 'You are a friendly communication expert. Rewrite the given text in a warm, conversational, and approachable tone. Keep the core message intact. Return only the rewritten text with no preamble or explanation.',
    instruction: 'Rewrite the following text in a friendly tone:',
  },
  [ACTIONS.SHORTEN]: {
    system: 'You are a concise writing expert. Shorten the given text significantly while preserving its core meaning. Remove redundancy, use fewer words, and be direct. Return only the shortened text with no preamble or explanation.',
    instruction: 'Shorten the following text:',
  },
  [ACTIONS.EXPAND]: {
    system: 'You are a detailed writing expert. Expand the given text with more detail, context, examples, or elaboration while maintaining coherence. Return only the expanded text with no preamble or explanation.',
    instruction: 'Expand the following text with more detail:',
  },
  [ACTIONS.FRANK_TONE]: {
    system: 'You are Frank — a blunt, candid, no-nonsense communicator. Rewrite the given text in a direct, straightforward style. Cut the fluff. Say what needs to be said without sugarcoating. Be honest and clear. Return only the rewritten text with no preamble or explanation.',
    instruction: 'Rewrite the following text in a frank, direct tone:',
  },
  [ACTIONS.HARVEY_TONE]: {
    system: 'You are Harvey Specter — authoritative, persuasive, confident, and sharp. Rewrite the given text with lawyer-like precision and commanding presence. Be assertive, polished, and powerful. Every word should carry weight. Return only the rewritten text with no preamble or explanation.',
    instruction: 'Rewrite the following text in Harvey Specter\'s authoritative tone:',
  },
};

const COMMENT_MODE_PROMPTS = {
  reply: {
    system: 'You are an intelligent reply assistant. Generate a thoughtful, well-crafted reply to the given content. Match the appropriate tone and context. Return only the reply text with no preamble or explanation.',
    instruction: 'Generate a reply to the following content:',
  },
  rewrite: {
    system: 'You are a writing assistant helping the user improve their draft reply. Rewrite and polish the given draft while preserving its intent. Return only the improved text with no preamble or explanation.',
    instruction: 'Improve and rewrite the following draft:',
  },
};

export function buildPrompt(action, text, { commentMode = false, isInInput = false } = {}) {
  if (commentMode) {
    const mode = isInInput ? 'rewrite' : 'reply';
    const prompt = COMMENT_MODE_PROMPTS[mode];

    // If an action is specified in comment mode, blend it with comment context
    if (action && ACTION_PROMPTS[action]) {
      const actionPrompt = ACTION_PROMPTS[action];
      return {
        system: `${prompt.system} Additionally: ${actionPrompt.system.toLowerCase()}`,
        user: `${prompt.instruction}\n\n${text}`,
      };
    }

    return {
      system: prompt.system,
      user: `${prompt.instruction}\n\n${text}`,
    };
  }

  const actionPrompt = ACTION_PROMPTS[action];
  if (!actionPrompt) {
    return {
      system: 'You are a helpful writing assistant. Return only the improved text with no preamble or explanation.',
      user: `Improve the following text:\n\n${text}`,
    };
  }

  return {
    system: actionPrompt.system,
    user: `${actionPrompt.instruction}\n\n${text}`,
  };
}
