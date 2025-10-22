#!/bin/bash
###############################################################################
# Auto-Deployment Script
# Triggered by GitHub webhook on push
###############################################################################

set -e

DEPLOY_DIR="/var/www/discord-bot"
LOG_FILE="$DEPLOY_DIR/logs/deploy.log"

# Create log file if doesn't exist
mkdir -p "$DEPLOY_DIR/logs"
touch "$LOG_FILE"

echo "================================================================" >> "$LOG_FILE"
echo "$(date): Starting auto-deployment" >> "$LOG_FILE"
echo "================================================================" >> "$LOG_FILE"

cd "$DEPLOY_DIR"

# Pull latest changes from GitHub
echo "$(date): Pulling latest changes from GitHub..." >> "$LOG_FILE"
git pull origin main >> "$LOG_FILE" 2>&1

# Install/update dependencies
echo "$(date): Installing dependencies..." >> "$LOG_FILE"
npm install --production >> "$LOG_FILE" 2>&1

# Restart PM2 processes
echo "$(date): Restarting PM2 processes..." >> "$LOG_FILE"
pm2 restart ecosystem.config.js >> "$LOG_FILE" 2>&1

echo "$(date): ✓ Deployment complete!" >> "$LOG_FILE"
echo "================================================================" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

exit 0
