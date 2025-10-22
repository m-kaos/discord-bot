/**
 * Voice State Update Event Handler
 * Fires when a member joins/leaves/moves voice channels or changes mute/deaf state
 */

const logger = require('../utils/logger');
const cache = require('../cache');

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState) {
    try {
      const member = newState.member || oldState.member;

      if (!member || member.user.bot) return;

      // Update voice state in cache
      cache.updateVoiceState(member.id, oldState, newState);

      // Log voice activity
      if (!oldState.channelId && newState.channelId) {
        logger.info(`🎤 ${member.user.username} joined voice channel: ${newState.channel.name}`);
      } else if (oldState.channelId && !newState.channelId) {
        logger.info(`🔇 ${member.user.username} left voice channel: ${oldState.channel.name}`);
      } else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        logger.info(`🔄 ${member.user.username} moved from ${oldState.channel.name} to ${newState.channel.name}`);
      }

    } catch (error) {
      logger.error('Error in voiceStateUpdate event:', error);
    }
  },
};
