/**
 * Simple Logger Utility
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function timestamp() {
  return new Date().toISOString();
}

const logger = {
  info: (message, ...args) => {
    console.log(`${colors.cyan}[INFO]${colors.reset} ${colors.dim}${timestamp()}${colors.reset} ${message}`, ...args);
  },

  success: (message, ...args) => {
    console.log(`${colors.green}[SUCCESS]${colors.reset} ${colors.dim}${timestamp()}${colors.reset} ${message}`, ...args);
  },

  warn: (message, ...args) => {
    console.warn(`${colors.yellow}[WARN]${colors.reset} ${colors.dim}${timestamp()}${colors.reset} ${message}`, ...args);
  },

  error: (message, ...args) => {
    console.error(`${colors.red}[ERROR]${colors.reset} ${colors.dim}${timestamp()}${colors.reset} ${message}`, ...args);
  },

  debug: (message, ...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`${colors.magenta}[DEBUG]${colors.reset} ${colors.dim}${timestamp()}${colors.reset} ${message}`, ...args);
    }
  },

  bot: (message, ...args) => {
    console.log(`${colors.blue}[BOT]${colors.reset} ${colors.dim}${timestamp()}${colors.reset} ${message}`, ...args);
  },

  api: (message, ...args) => {
    console.log(`${colors.cyan}[API]${colors.reset} ${colors.dim}${timestamp()}${colors.reset} ${message}`, ...args);
  },
};

module.exports = logger;
