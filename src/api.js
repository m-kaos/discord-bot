/**
 * Express REST API Server
 * Exposes Discord bot data to the React frontend
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const { exec } = require('child_process');
const cache = require('./cache');
const logger = require('./utils/logger');
const { getUpcomingBirthdays, getAllBirthdaysSorted, checkBirthdays, sendBirthdayNotification } = require('./utils/birthdayChecker');

const app = express();
const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(express.json());

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'Too many requests from this IP, please try again later.',
});

app.use(limiter);

// Optional API key authentication
const authenticateApiKey = (req, res, next) => {
  if (!process.env.API_KEY) {
    return next(); // No API key required if not set
  }

  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
  }

  next();
};

// Logging middleware
app.use((req, res, next) => {
  logger.api(`${req.method} ${req.path}`);
  next();
});

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  const cacheStats = cache.getStats();
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    cache: cacheStats,
  });
});

/**
 * GET /api/members
 * Get all server members with their presence
 */
app.get('/api/members', authenticateApiKey, (req, res) => {
  try {
    const members = cache.getAllMembers();
    res.json({
      success: true,
      count: members.length,
      members: members,
    });
  } catch (error) {
    logger.error('Error fetching members:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/members/online
 * Get only online members (online, idle, dnd)
 */
app.get('/api/members/online', authenticateApiKey, (req, res) => {
  try {
    const onlineMembers = cache.getOnlineMembers();
    res.json({
      success: true,
      count: onlineMembers.length,
      members: onlineMembers,
    });
  } catch (error) {
    logger.error('Error fetching online members:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/members/:userId
 * Get specific member by ID
 */
app.get('/api/members/:userId', authenticateApiKey, (req, res) => {
  try {
    const member = cache.getMember(req.params.userId);
    if (!member) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }
    res.json({
      success: true,
      member: member,
    });
  } catch (error) {
    logger.error('Error fetching member:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/stats
 * Get server statistics
 */
app.get('/api/stats', authenticateApiKey, (req, res) => {
  try {
    const stats = cache.serverStats;
    const cacheStats = cache.getStats();
    res.json({
      success: true,
      server: stats,
      cache: cacheStats,
    });
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/voice
 * Get all active voice channels with members
 */
app.get('/api/voice', authenticateApiKey, (req, res) => {
  try {
    const voiceChannels = cache.getVoiceChannels();
    res.json({
      success: true,
      count: voiceChannels.length,
      channels: voiceChannels,
    });
  } catch (error) {
    logger.error('Error fetching voice channels:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/voice/:channelId
 * Get specific voice channel info
 */
app.get('/api/voice/:channelId', authenticateApiKey, (req, res) => {
  try {
    const voiceChannels = cache.getVoiceChannels();
    const channel = voiceChannels.find(ch => ch.id === req.params.channelId);

    if (!channel) {
      return res.status(404).json({ success: false, error: 'Voice channel not found or empty' });
    }

    res.json({
      success: true,
      channel: channel,
    });
  } catch (error) {
    logger.error('Error fetching voice channel:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/birthdays
 * Get all birthdays sorted by next occurrence
 */
app.get('/api/birthdays', authenticateApiKey, (req, res) => {
  try {
    const birthdays = getAllBirthdaysSorted();
    res.json({
      success: true,
      count: birthdays.length,
      birthdays: birthdays,
    });
  } catch (error) {
    logger.error('Error fetching birthdays:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/birthdays/upcoming
 * Get birthdays in the next 7 days (configurable via ?days=N)
 */
app.get('/api/birthdays/upcoming', authenticateApiKey, (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const upcoming = getUpcomingBirthdays(days);
    res.json({
      success: true,
      days: days,
      count: upcoming.length,
      birthdays: upcoming,
    });
  } catch (error) {
    logger.error('Error fetching upcoming birthdays:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/birthdays/today
 * Check if anyone has a birthday today
 */
app.get('/api/birthdays/today', authenticateApiKey, (req, res) => {
  try {
    const birthdaysToday = checkBirthdays();
    res.json({
      success: true,
      count: birthdaysToday.length,
      birthdays: birthdaysToday,
    });
  } catch (error) {
    logger.error('Error checking birthdays today:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/birthdays/check
 * Manually trigger birthday check and send notifications
 */
app.post('/api/birthdays/check', authenticateApiKey, async (req, res) => {
  try {
    const client = require('./bot');

    if (!process.env.BIRTHDAY_CHANNEL_ID) {
      return res.status(400).json({
        success: false,
        error: 'BIRTHDAY_CHANNEL_ID not configured'
      });
    }

    await sendBirthdayNotification(client, process.env.BIRTHDAY_CHANNEL_ID);
    const birthdaysToday = checkBirthdays();

    res.json({
      success: true,
      message: 'Birthday check completed',
      birthdaysToday: birthdaysToday,
    });
  } catch (error) {
    logger.error('Error triggering birthday check:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/webhook/deploy
 * GitHub webhook for auto-deployment
 */
app.post('/api/webhook/deploy', express.json(), (req, res) => {
  try {
    const secret = process.env.GITHUB_WEBHOOK_SECRET;

    // Verify webhook secret if configured
    if (secret) {
      const signature = req.headers['x-hub-signature-256'];

      if (!signature) {
        logger.warn('GitHub webhook missing signature');
        return res.status(401).json({ error: 'Missing signature' });
      }

      const hash = 'sha256=' + crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (signature !== hash) {
        logger.warn('Invalid GitHub webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    logger.info('🚀 Received GitHub webhook, starting auto-deployment...');

    // Immediately respond to GitHub
    res.json({
      status: 'deployment triggered',
      timestamp: new Date(),
    });

    // Run deployment script asynchronously
    const deployScript = process.env.DEPLOY_SCRIPT || '/var/www/discord-bot/auto-deploy.sh';

    exec(deployScript, (error, stdout, stderr) => {
      if (error) {
        logger.error('Deployment failed:', error.message);
        logger.error('stderr:', stderr);
        return;
      }

      logger.success('✓ Auto-deployment completed successfully');
      if (stdout) {
        logger.info('Deployment output:', stdout.trim());
      }
    });

  } catch (error) {
    logger.error('Error in webhook handler:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Express error:', err);
  res.status(500).json({ success: false, error: err.message });
});

// Start server
app.listen(PORT, () => {
  logger.success(`API server listening on port ${PORT}`);
  logger.info(`Allowed origins: ${allowedOrigins.join(', ')}`);
  logger.info(`API key authentication: ${process.env.API_KEY ? 'ENABLED' : 'DISABLED'}`);
});

module.exports = app;
