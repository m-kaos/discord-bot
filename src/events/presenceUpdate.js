/**
 * Presence Update Event Handler
 * Fires when a member's presence changes (online/offline/idle/dnd, activity)
 */

const logger = require('../utils/logger');
const cache = require('../cache');

module.exports = {
  name: 'presenceUpdate',
  async execute(oldPresence, newPresence) {
    try {
      const member = newPresence.member;

      if (!member || member.user.bot) return;

      // Update presence in cache
      cache.updatePresence(member.id, newPresence);

      // Log status changes (for debugging)
      if (oldPresence?.status !== newPresence.status) {
        logger.debug(`${member.user.username} is now ${newPresence.status}`);
      }

      // Update server stats
      const guild = newPresence.guild;
      cache.updateServerStats(guild);

    } catch (error) {
      logger.error('Error in presenceUpdate event:', error);
    }
  },
};
