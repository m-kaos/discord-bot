/**
 * PM2 Ecosystem Configuration
 * For production deployment on VPS
 */

module.exports = {
  apps: [
    {
      name: 'shitfucks-bot',
      script: './src/bot.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/bot-error.log',
      out_file: './logs/bot-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
    // API is now started by bot.js to share memory space
    // No need for separate process
  ],
};
