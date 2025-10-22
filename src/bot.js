/**
 * Shit Fucks Discord Bot
 * Main bot file that initializes Discord client and loads event handlers
 */

require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const logger = require('./utils/logger');
const { sendBirthdayNotification } = require('./utils/birthdayChecker');

// Create Discord client with required intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.GuildMember],
});

// Load event handlers
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);

  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }

  logger.info(`Loaded event: ${event.name}`);
}

// Schedule birthday check (runs daily at midnight)
cron.schedule('0 0 * * *', () => {
  logger.info('Running daily birthday check...');
  if (process.env.BIRTHDAY_CHANNEL_ID) {
    sendBirthdayNotification(client, process.env.BIRTHDAY_CHANNEL_ID);
  } else {
    logger.warn('BIRTHDAY_CHANNEL_ID not set in environment variables');
  }
}, {
  timezone: process.env.TZ || 'America/Mexico_City'
});

logger.info('Birthday checker scheduled for midnight daily');

// Global error handling
client.on('error', error => {
  logger.error('Discord client error:', error);
});

client.on('warn', warning => {
  logger.warn('Discord client warning:', warning);
});

process.on('unhandledRejection', error => {
  logger.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  client.destroy();
  process.exit(0);
});

// Login to Discord
if (!process.env.DISCORD_TOKEN) {
  logger.error('DISCORD_TOKEN not found in environment variables');
  process.exit(1);
}

if (!process.env.GUILD_ID) {
  logger.error('GUILD_ID not found in environment variables');
  process.exit(1);
}

logger.info('Starting Discord bot...');
client.login(process.env.DISCORD_TOKEN);

// Export client for API usage
module.exports = client;
