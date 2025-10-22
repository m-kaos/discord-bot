/**
 * In-Memory Cache for Discord Bot Data
 * Stores member presences, voice states, and server stats
 */

class BotCache {
  constructor() {
    // Member data with presence info
    this.members = new Map(); // userId -> { id, username, discriminator, avatar, status, activity, joinedAt }

    // Voice channel data
    this.voiceStates = new Map(); // userId -> { channelId, channelName, joinedAt, selfMute, selfDeaf, serverMute, serverDeaf }

    // Voice channels map
    this.voiceChannels = new Map(); // channelId -> { id, name, members: [userIds] }

    // Server stats
    this.serverStats = {
      totalMembers: 0,
      onlineMembers: 0,
      memberCount: 0,
      boostLevel: 0,
      boostCount: 0,
      lastUpdated: null
    };

    // Birthday list (synced from config)
    this.birthdays = [];
  }

  /**
   * Update or add a member to cache
   */
  updateMember(member, presence = null) {
    const memberData = {
      id: member.id,
      username: member.user.username,
      discriminator: member.user.discriminator,
      displayName: member.displayName || member.user.username,
      avatar: member.user.displayAvatarURL({ dynamic: true, size: 256 }),
      bot: member.user.bot,
      status: presence?.status || 'offline',
      activities: presence?.activities?.map(activity => ({
        name: activity.name,
        type: activity.type, // 0: Playing, 1: Streaming, 2: Listening, 3: Watching, 5: Competing
        details: activity.details,
        state: activity.state
      })) || [],
      joinedAt: member.joinedAt,
      roles: member.roles.cache.map(role => ({
        id: role.id,
        name: role.name,
        color: role.hexColor
      })),
      lastUpdated: new Date()
    };

    this.members.set(member.id, memberData);
    return memberData;
  }

  /**
   * Update member presence (online, idle, dnd, offline)
   */
  updatePresence(userId, presence) {
    const member = this.members.get(userId);
    if (member) {
      member.status = presence.status;
      member.activities = presence.activities?.map(activity => ({
        name: activity.name,
        type: activity.type,
        details: activity.details,
        state: activity.state
      })) || [];
      member.lastUpdated = new Date();
    }
  }

  /**
   * Update voice state for a member
   */
  updateVoiceState(userId, oldState, newState) {
    // Left voice channel
    if (oldState.channelId && !newState.channelId) {
      const voiceData = this.voiceStates.get(userId);
      if (voiceData) {
        voiceData.leftAt = new Date();
        voiceData.duration = voiceData.leftAt - voiceData.joinedAt;
      }
      this.voiceStates.delete(userId);

      // Remove from voice channel members
      if (this.voiceChannels.has(oldState.channelId)) {
        const channel = this.voiceChannels.get(oldState.channelId);
        channel.members = channel.members.filter(id => id !== userId);
        if (channel.members.length === 0) {
          this.voiceChannels.delete(oldState.channelId);
        }
      }
    }

    // Joined voice channel
    if (!oldState.channelId && newState.channelId) {
      const voiceData = {
        userId,
        channelId: newState.channelId,
        channelName: newState.channel?.name || 'Unknown',
        joinedAt: new Date(),
        selfMute: newState.selfMute,
        selfDeaf: newState.selfDeaf,
        serverMute: newState.serverMute,
        serverDeaf: newState.serverDeaf
      };
      this.voiceStates.set(userId, voiceData);

      // Add to voice channel members
      if (!this.voiceChannels.has(newState.channelId)) {
        this.voiceChannels.set(newState.channelId, {
          id: newState.channelId,
          name: newState.channel?.name || 'Unknown',
          members: []
        });
      }
      this.voiceChannels.get(newState.channelId).members.push(userId);
    }

    // Moved between channels
    if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
      // Remove from old channel
      if (this.voiceChannels.has(oldState.channelId)) {
        const oldChannel = this.voiceChannels.get(oldState.channelId);
        oldChannel.members = oldChannel.members.filter(id => id !== userId);
        if (oldChannel.members.length === 0) {
          this.voiceChannels.delete(oldState.channelId);
        }
      }

      // Add to new channel
      if (!this.voiceChannels.has(newState.channelId)) {
        this.voiceChannels.set(newState.channelId, {
          id: newState.channelId,
          name: newState.channel?.name || 'Unknown',
          members: []
        });
      }
      this.voiceChannels.get(newState.channelId).members.push(userId);

      // Update voice state
      const voiceData = this.voiceStates.get(userId);
      if (voiceData) {
        voiceData.channelId = newState.channelId;
        voiceData.channelName = newState.channel?.name || 'Unknown';
      }
    }

    // Update mute/deaf states
    if (newState.channelId) {
      const voiceData = this.voiceStates.get(userId);
      if (voiceData) {
        voiceData.selfMute = newState.selfMute;
        voiceData.selfDeaf = newState.selfDeaf;
        voiceData.serverMute = newState.serverMute;
        voiceData.serverDeaf = newState.serverDeaf;
      }
    }
  }

  /**
   * Get all members
   */
  getAllMembers() {
    return Array.from(this.members.values());
  }

  /**
   * Get only online members (online, idle, dnd)
   */
  getOnlineMembers() {
    return Array.from(this.members.values())
      .filter(member => member.status !== 'offline' && !member.bot);
  }

  /**
   * Get member by ID
   */
  getMember(userId) {
    return this.members.get(userId);
  }

  /**
   * Get all voice channels with current occupants
   */
  getVoiceChannels() {
    return Array.from(this.voiceChannels.values()).map(channel => ({
      ...channel,
      memberDetails: channel.members.map(userId => this.members.get(userId)).filter(Boolean)
    }));
  }

  /**
   * Get voice state for specific user
   */
  getVoiceState(userId) {
    return this.voiceStates.get(userId);
  }

  /**
   * Update server statistics
   */
  updateServerStats(guild) {
    const onlineCount = Array.from(this.members.values())
      .filter(member => member.status !== 'offline' && !member.bot).length;

    this.serverStats = {
      totalMembers: guild.memberCount,
      onlineMembers: onlineCount,
      memberCount: guild.memberCount,
      boostLevel: guild.premiumTier,
      boostCount: guild.premiumSubscriptionCount || 0,
      serverName: guild.name,
      serverIcon: guild.iconURL({ dynamic: true, size: 256 }),
      lastUpdated: new Date()
    };
  }

  /**
   * Set birthday list
   */
  setBirthdays(birthdays) {
    this.birthdays = birthdays;
  }

  /**
   * Get birthdays
   */
  getBirthdays() {
    return this.birthdays;
  }

  /**
   * Get cache statistics (for debugging)
   */
  getStats() {
    return {
      totalMembers: this.members.size,
      onlineMembers: this.getOnlineMembers().length,
      voiceChannels: this.voiceChannels.size,
      membersInVoice: this.voiceStates.size,
      lastUpdated: new Date()
    };
  }

  /**
   * Clear all cache (use with caution)
   */
  clear() {
    this.members.clear();
    this.voiceStates.clear();
    this.voiceChannels.clear();
    this.serverStats = {
      totalMembers: 0,
      onlineMembers: 0,
      memberCount: 0,
      boostLevel: 0,
      boostCount: 0,
      lastUpdated: null
    };
  }
}

// Singleton instance
const cache = new BotCache();

module.exports = cache;
