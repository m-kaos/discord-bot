/**
 * Message Create Event Handler
 * Handles incoming messages and triggers AI responses when appropriate
 */

const logger = require('../utils/logger');
const { generateResponse } = require('../utils/openaiHandler');
const config = require('../config');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    // Ignore messages from bots (including self)
    if (message.author.bot) return;

    // Only respond in the configured guild
    if (message.guildId !== process.env.GUILD_ID) return;

    const botMention = `<@${message.client.user.id}>`;
    const botName = message.client.user.username;

    // Check if bot should respond
    let shouldRespond = false;
    let cleanMessage = message.content;

    // 1. Bot was directly mentioned with @
    if (message.mentions.has(message.client.user.id)) {
      shouldRespond = true;
      // Remove the bot mention from the message
      cleanMessage = message.content.replace(new RegExp(`<@!?${message.client.user.id}>`, 'g'), '').trim();
      logger.info(`Bot mentioned by ${message.author.tag} in #${message.channel.name}`);
    }

    // 2. Bot name appears in message
    else if (message.content.toLowerCase().includes(botName.toLowerCase())) {
      shouldRespond = true;
      logger.info(`Bot name detected in message from ${message.author.tag} in #${message.channel.name}`);
    }

    // 3. Message is in a designated chat channel
    else if (config.chatChannels && config.chatChannels.includes(message.channelId)) {
      shouldRespond = true;
      logger.info(`Message in chat channel #${message.channel.name} from ${message.author.tag}`);
    }

    // 4. Direct messages (DMs)
    if (message.channel.type === 1) { // DM Channel
      shouldRespond = true;
      logger.info(`DM received from ${message.author.tag}`);
    }

    // If bot should not respond, exit early
    if (!shouldRespond) return;

    // If message is empty after cleaning, skip
    if (!cleanMessage || cleanMessage.trim().length === 0) {
      return;
    }

    try {
      // Show typing indicator
      await message.channel.sendTyping();

      // Get guild member names for context (for personality)
      const guild = message.guild;
      let memberNames = [];

      if (guild) {
        const members = await guild.members.fetch({ limit: 100 });
        memberNames = members
          .filter(m => !m.user.bot)
          .map(m => m.displayName || m.user.username)
          .slice(0, 30); // Limit to 30 names to avoid token overflow
      }

      // Generate AI response
      const result = await generateResponse(
        message.author.id,
        message.author.username,
        cleanMessage,
        botName,
        guild ? guild.name : 'DM',
        memberNames
      );

      // Log token usage for monitoring
      if (result.tokensUsed) {
        logger.info(`AI response: ${result.tokensUsed} tokens, ${result.conversationLength} messages in history`);
      }

      // Send response
      if (result.response) {
        // Split long responses if needed (Discord has 2000 char limit)
        const response = result.response;
        if (response.length > 2000) {
          const chunks = response.match(/.{1,1900}/g) || [];
          for (const chunk of chunks) {
            await message.reply(chunk);
          }
        } else {
          await message.reply(response);
        }

        logger.success(`Replied to ${message.author.tag}`);
      }

    } catch (error) {
      logger.error('Error handling message:', error);

      // Send error message to user
      try {
        await message.reply("Oof, something broke on my end. My bad! 😅");
      } catch (replyError) {
        logger.error('Failed to send error message:', replyError);
      }
    }
  },
};
