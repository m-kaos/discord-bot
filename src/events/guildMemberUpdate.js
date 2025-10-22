/**
 * Guild Member Update Event Handler
 * Fires when a member is updated (roles, nickname, etc.)
 */

const logger = require('../utils/logger');
const cache = require('../cache');

module.exports = {
  name: 'guildMemberUpdate',
  async execute(oldMember, newMember) {
    try {
      if (newMember.user.bot) return;

      // Fetch presence for the member
      const presence = newMember.guild.presences.cache.get(newMember.id);

      // Update member in cache
      cache.updateMember(newMember, presence);

      logger.debug(`Updated member: ${newMember.user.username}`);

    } catch (error) {
      logger.error('Error in guildMemberUpdate event:', error);
    }
  },
};
