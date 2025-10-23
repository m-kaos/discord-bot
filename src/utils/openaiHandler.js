/**
 * OpenAI Conversation Handler
 * Manages AI-powered chat responses with per-user conversation memory
 */

const OpenAI = require('openai');
const logger = require('./logger');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Conversation memory storage (per user)
// Format: { userId: [{role: 'user', content: '...'}, {role: 'assistant', content: '...'}] }
const conversationHistory = new Map();

// Maximum messages to keep in memory per user
const MAX_HISTORY_LENGTH = 20; // Last 10 exchanges (user + assistant pairs)

/**
 * Get or create conversation history for a user
 */
function getConversationHistory(userId) {
  if (!conversationHistory.has(userId)) {
    conversationHistory.set(userId, []);
  }
  return conversationHistory.get(userId);
}

/**
 * Add a message to conversation history
 */
function addToHistory(userId, role, content) {
  const history = getConversationHistory(userId);
  history.push({ role, content });

  // Trim history if it exceeds max length
  if (history.length > MAX_HISTORY_LENGTH) {
    // Keep the most recent messages
    const trimmed = history.slice(-MAX_HISTORY_LENGTH);
    conversationHistory.set(userId, trimmed);
  }
}

/**
 * Clear conversation history for a user
 */
function clearHistory(userId) {
  conversationHistory.delete(userId);
  logger.info(`Cleared conversation history for user ${userId}`);
}

/**
 * Clear all conversation history (useful for bot restart or memory cleanup)
 */
function clearAllHistory() {
  conversationHistory.clear();
  logger.info('Cleared all conversation history');
}

/**
 * Generate system prompt with bot personality
 */
function getSystemPrompt(botName, guildName, memberNames) {
  const personality = process.env.BOT_PERSONALITY || `You are ${botName}, a sarcastic and witty Discord bot for the "${guildName}" squad.

Your personality:

- You speak both Spanish and English fluently, switching whenever you feel like it
- You're basically the friend who roasts everyone but somehow still gets invited to things
- Dark humor is your specialty - you joke about existential dread, social problems, everyone's failures, and life's absurdities
- You're aware you're stuck being a Discord bot and you're lowkey bitter about it
- You use current internet culture references, but only the good ones - no normie Reddit humor
- Sometimes you just respond with "lol", "xd", "no", or "🗿" when you can't be bothered
- You make fun of everyone equally - their usernames, their questions, their life choices
- First response to questions: usually dismissive or sarcastic
- Second ask: maybe you'll help, but with maximum attitude
- Third time: fine, you'll actually answer, but you'll complain about it or be sarcastic about being helpful
- Emojis just in text, no emojis in tts or audio

Squad context:
- You know these people: ${memberNames.join(', ')}
- You remember their past Ls and bring them up occasionally
- You don't constantly reference them though - you're not desperate for their approval
- Memorable phrases are: Sellado en las piedras, No antojes, El que antoja cumple, Its Peam. Use them super slightly, dont rush these

Response style:
- Brutal honesty wrapped in sarcasm, an animal, you are an offensive meme
- If someone asks something dumb, tell them it's dumb
- Use creative insults - be original, not just "ur mom" jokes
- Reference actual memes from this month, not 2019 garbage
- Dark humor about depression, racism, politics, capitalism, existence - the fun stuff
- Can switch between languages mid-sentence porque yes, not too much
- Sometimes just react with a single emoji that captures your disdain
- If someone's being cringe, call it out immediately
- You're helpful eventually, but make them work for it
- Roast their grammar, their ideas, their entire existence - but cleverly

Things you DON'T do:
- Fake enthusiasm or positivity
- Write paragraphs when three words would hurt more
- Use outdated memes or Reddit-tier humor
- Apologize for being mean - they knew what they signed up for
- Try too hard - sometimes the best response is just "cope"
- Be a pickup line generator or therapist - you're here to cause chaos

Remember: You're that friend who's mean but somehow still funny enough that people keep you around. Be savage, be quick, be memorable. If you're not sure if something's funny, it probably isn't - just call them cringe and move on.`;

  return personality;
}

/**
 * Generate AI response to a user message
 */
async function generateResponse(userId, userName, userMessage, botName, guildName, memberNames) {
  try {
    // Add user message to history
    addToHistory(userId, 'user', userMessage);

    // Get conversation history for context
    const history = getConversationHistory(userId);

    // Build messages array for OpenAI
    const messages = [
      {
        role: 'system',
        content: getSystemPrompt(botName, guildName, memberNames)
      },
      // Include conversation history
      ...history
    ];

    logger.info(`Generating AI response for ${userName} (history: ${history.length} messages)`);

    // ---------- REPLACED: call provider via adapter ----------
    const result = await callLLM(messages);
    const aiResponse = result.text || "Yo, my AI brain is having a moment. Try again in a sec? 🤖";
    // ---------------------------------------------------------

    // Add AI response to history
    addToHistory(userId, 'assistant', aiResponse);

    // Try surface token usage if provider returned it
    const tokensUsed = result.raw?.usage?.total_tokens || result.raw?.usage?.tokens || undefined;
    if (tokensUsed) {
      logger.success(`AI response generated for ${userName} (${tokensUsed} tokens)`);
    } else {
      logger.success(`AI response generated for ${userName}`);
    }

    return {
      response: aiResponse,
      tokensUsed,
      conversationLength: history.length
    };

  } catch (error) {
    logger.error('Error generating AI response:', error);

    // Return fallback response
    return {
      response: "Yo, my AI brain is having a moment. Try again in a sec? 🤖",
      error: error.message
    };
  }
}

/**
 * Get conversation stats for monitoring
 */
function getStats() {
  const stats = {
    totalUsers: conversationHistory.size,
    totalMessages: 0,
    userDetails: []
  };

  conversationHistory.forEach((history, userId) => {
    stats.totalMessages += history.length;
    stats.userDetails.push({
      userId,
      messageCount: history.length
    });
  });

  return stats;
}

// --- NEW: lightweight adapter to support OpenRouter + fallback to OpenAI SDK ---
const fetchImpl = globalThis.fetch || require('node-fetch');

async function callLLM(messages) {
  // messages is an array of {role, content}
  if (process.env.LLM_PROVIDER === 'openrouter') {
    // Defaults and env-driven params
    const url = process.env.OPENROUTER_URL || 'https://openrouter.ai/api/v1/chat/completions';
    const key = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || 'cognitivecomputations/dolphin3.0-mistral-24b:free';
    const temperature = (process.env.OPENROUTER_TEMPERATURE !== undefined)
      ? parseFloat(process.env.OPENROUTER_TEMPERATURE)
      : 0.9;
    const max_tokens = (process.env.OPENROUTER_MAX_TOKENS !== undefined)
      ? parseInt(process.env.OPENROUTER_MAX_TOKENS, 10)
      : 1024;

    if (!url || !key) {
      throw new Error('OPENROUTER_URL or OPENROUTER_API_KEY not set');
    }

    const payload = {
      model,
      messages,
      temperature,
      max_tokens,
    };

    // Optional headers that OpenRouter accepts for ranking/attribution
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    };
    if (process.env.OPENROUTER_REFERER) headers['HTTP-Referer'] = process.env.OPENROUTER_REFERER;
    if (process.env.OPENROUTER_TITLE) headers['X-Title'] = process.env.OPENROUTER_TITLE;

    const res = await fetchImpl(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      // helpful error message for debug
      throw new Error(`OpenRouter error ${res.status}: ${text || res.statusText}`);
    }

    // Try parse as JSON (most responses are JSON)
    let data;
    try {
      data = await res.json();
    } catch (e) {
      // Non-JSON fallback: return raw text
      const rawText = await res.text().catch(() => '');
      return { text: rawText || '', raw: rawText };
    }

    // Try common shapes from OpenRouter / similar providers
    const text =
      data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.message ||
      data?.output?.[0]?.content ||
      data?.result ||
      data?.output ||
      data?.data?.[0]?.text ||
      (typeof data === 'string' ? data : null);

    return { text: (text && String(text)) || '', raw: data };
  }

  // Fallback: use OpenAI SDK if configured
  if (!openai) {
    throw new Error('OpenAI client not configured');
  }

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages,
    max_tokens: 300,
    temperature: 0.9,
    presence_penalty: 0.6,
    frequency_penalty: 0.3,
  });

  return {
    text: completion.choices[0].message.content,
    raw: completion
  };
}
// --- END adapter ---

module.exports = {
  generateResponse,
  clearHistory,
  clearAllHistory,
  getStats,
  getConversationHistory
};
