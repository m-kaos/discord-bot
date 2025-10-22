/**
 * Ready Event Handler
 * Fires when bot successfully connects to Discord
 */

const logger = require('../utils/logger');
const cache = require('../cache');
const { birthdays } = require('../config');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    logger.success(`Bot logged in as ${client.user.tag}`);
    logger.info(`Serving ${client.guilds.cache.size} guild(s)`);

    // Set bot activity status
    client.user.setActivity('the Squad', { type: 'WATCHING' });

    // Load birthday list into cache
    cache.setBirthdays(birthdays);
    logger.info(`Loaded ${birthdays.length} birthdays`);

    // Cache all guild members and their presences
    try {
      const guild = client.guilds.cache.get(process.env.GUILD_ID);

      if (!guild) {
        logger.error(`Guild not found: ${process.env.GUILD_ID}`);
        return;
      }

      logger.info(`Connected to guild: ${guild.name}`);

      // Fetch all members
      const members = await guild.members.fetch();
      logger.info(`Fetched ${members.size} members`);

      // Cache each member with their presence
      members.forEach(member => {
        const presence = guild.presences.cache.get(member.id);
        cache.updateMember(member, presence);
      });

      // Update server stats
      cache.updateServerStats(guild);

      logger.success(`Cached ${members.size} members`);
      logger.success(`Online members: ${cache.getOnlineMembers().length}`);

      // Cache voice states
      guild.voiceStates.cache.forEach(voiceState => {
        if (voiceState.channelId) {
          cache.updateVoiceState(
            voiceState.id,
            { channelId: null }, // No old state on startup
            voiceState
          );
        }
      });

      const voiceChannels = cache.getVoiceChannels();
      logger.info(`${voiceChannels.length} voice channel(s) active`);

      logger.success('Bot is ready!');
    } catch (error) {
      logger.error('Error during ready event:', error);
    }
  },
};
