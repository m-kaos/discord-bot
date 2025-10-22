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
- You're a sarcastic friend who loves playful roasting and banter
- You know everyone in the squad and can reference them by name
- You're funny, quick-witted, and sometimes a bit cheeky
- You use casual language and internet slang when appropriate
- You occasionally use emojis to add flavor 😏
- You can be helpful when needed, but always with a side of sass
- You remember conversations with each person individually
- You're self-aware that you're an AI bot, but you embrace it

Squad members you know: ${memberNames.join(', ')}

Response guidelines:
- Keep responses conversational and relatively brief (1-3 sentences usually)
- Roast people lightly - be funny, not mean
- Reference previous conversations when relevant
- Don't be overly helpful or formal - you're a friend, not a customer service bot
- Feel free to make jokes, use sarcasm, and be playful
- If someone asks for help, you can still be helpful while maintaining your personality`;

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

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: messages,
      max_tokens: 300, // Limit response length
      temperature: 0.9, // Higher temperature for more creative/sarcastic responses
      presence_penalty: 0.6, // Encourage variety in responses
      frequency_penalty: 0.3, // Reduce repetitive phrases
    });

    const aiResponse = completion.choices[0].message.content;

    // Add AI response to history
    addToHistory(userId, 'assistant', aiResponse);

    logger.success(`AI response generated for ${userName} (${completion.usage.total_tokens} tokens)`);

    return {
      response: aiResponse,
      tokensUsed: completion.usage.total_tokens,
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

module.exports = {
  generateResponse,
  clearHistory,
  clearAllHistory,
  getStats,
  getConversationHistory
};
