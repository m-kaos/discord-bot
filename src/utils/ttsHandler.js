/**
 * TTS Voice Handler
 * Handles text-to-speech in Discord voice channels
 */

const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState
} = require('@discordjs/voice');
const { createWriteStream } = require('fs');
const { pipeline } = require('stream/promises');
const https = require('https');
const logger = require('./logger');
const path = require('path');
const fs = require('fs');

// Active voice connections
const voiceConnections = new Map();

/**
 * Generate TTS audio using Google Translate TTS API (free)
 * @param {string} text - Text to convert to speech
 * @returns {Promise<string>} - Path to generated audio file
 */
async function generateTTS(text) {
  // Create temp directory if it doesn't exist
  const tempDir = path.join(__dirname, '../../temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const filename = `tts-${Date.now()}.mp3`;
  const filepath = path.join(tempDir, filename);

  // Google Translate TTS URL (free, no API key needed)
  // Max 200 characters per request
  const textEncoded = encodeURIComponent(text.substring(0, 200));
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${textEncoded}`;

  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    }, (response) => {
      const fileStream = createWriteStream(filepath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve(filepath);
      });

      fileStream.on('error', (err) => {
        fs.unlink(filepath, () => {});
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Join voice channel and play TTS
 * @param {Object} member - Discord guild member
 * @param {string} text - Text to speak
 */
async function speakInVoice(member, text) {
  try {
    // Check if member is in a voice channel
    const voiceChannel = member.voice.channel;
    if (!voiceChannel) {
      logger.warn(`Member ${member.user.tag} is not in a voice channel`);
      return false;
    }

    logger.info(`Speaking TTS in voice channel: ${voiceChannel.name}`);

    // Join voice channel
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: member.guild.id,
      adapterCreator: member.guild.voiceAdapterCreator,
    });

    // Store connection
    voiceConnections.set(member.guild.id, connection);

    // Wait for connection to be ready
    await entersState(connection, VoiceConnectionStatus.Ready, 20000);

    // Generate TTS audio
    const audioPath = await generateTTS(text);

    // Create audio player
    const player = createAudioPlayer();
    const resource = createAudioResource(audioPath);

    // Play audio
    connection.subscribe(player);
    player.play(resource);

    // Wait for audio to finish
    await new Promise((resolve) => {
      player.on(AudioPlayerStatus.Idle, () => {
        resolve();
      });
    });

    // Clean up audio file
    fs.unlink(audioPath, (err) => {
      if (err) logger.error('Error deleting TTS file:', err);
    });

    // Leave voice channel after 2 seconds
    setTimeout(() => {
      connection.destroy();
      voiceConnections.delete(member.guild.id);
      logger.info('Left voice channel');
    }, 2000);

    return true;

  } catch (error) {
    logger.error('Error in TTS voice:', error);

    // Clean up connection on error
    const connection = voiceConnections.get(member.guild.id);
    if (connection) {
      connection.destroy();
      voiceConnections.delete(member.guild.id);
    }

    return false;
  }
}

/**
 * Clean up all voice connections
 */
function cleanup() {
  voiceConnections.forEach(connection => {
    connection.destroy();
  });
  voiceConnections.clear();
  logger.info('Cleaned up all voice connections');
}

module.exports = {
  speakInVoice,
  cleanup,
};
