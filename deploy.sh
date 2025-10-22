#!/bin/bash

###############################################################################
# Deployment Script for Shit Fucks Discord Bot
# Usage: ./deploy.sh [vps-user@vps-ip]
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REMOTE_DIR="/var/www/discord-bot"
LOCAL_DIR="$(pwd)"

# Check if remote host provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Please provide VPS address${NC}"
    echo "Usage: ./deploy.sh user@your-vps-ip"
    exit 1
fi

REMOTE_HOST="$1"

echo -e "${BLUE}====================================${NC}"
echo -e "${BLUE}Discord Bot Deployment Script${NC}"
echo -e "${BLUE}====================================${NC}"
echo

# Step 1: Test SSH connection
echo -e "${YELLOW}[1/7] Testing SSH connection...${NC}"
if ssh -o BatchMode=yes -o ConnectTimeout=5 "$REMOTE_HOST" exit 2>/dev/null; then
    echo -e "${GREEN}✓ SSH connection successful${NC}"
else
    echo -e "${RED}✗ SSH connection failed${NC}"
    echo "Please ensure you have SSH key authentication set up"
    exit 1
fi

# Step 2: Create remote directory
echo -e "${YELLOW}[2/7] Creating remote directory...${NC}"
ssh "$REMOTE_HOST" "sudo mkdir -p $REMOTE_DIR && sudo chown \$USER:\$USER $REMOTE_DIR"
echo -e "${GREEN}✓ Remote directory ready${NC}"

# Step 3: Sync files to VPS
echo -e "${YELLOW}[3/7] Syncing files to VPS...${NC}"
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude 'logs' \
    --exclude '.git' \
    --exclude '.env' \
    --exclude '*.log' \
    "$LOCAL_DIR/" "$REMOTE_HOST:$REMOTE_DIR/"
echo -e "${GREEN}✓ Files synced${NC}"

# Step 4: Install dependencies on VPS
echo -e "${YELLOW}[4/7] Installing dependencies...${NC}"
ssh "$REMOTE_HOST" "cd $REMOTE_DIR && npm install --production"
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Step 5: Create logs directory
echo -e "${YELLOW}[5/7] Creating logs directory...${NC}"
ssh "$REMOTE_HOST" "cd $REMOTE_DIR && mkdir -p logs"
echo -e "${GREEN}✓ Logs directory created${NC}"

# Step 6: Check .env file
echo -e "${YELLOW}[6/7] Checking .env file...${NC}"
if ssh "$REMOTE_HOST" "[ -f $REMOTE_DIR/.env ]"; then
    echo -e "${GREEN}✓ .env file exists${NC}"
else
    echo -e "${YELLOW}⚠ .env file not found${NC}"
    echo "Creating .env from template..."
    ssh "$REMOTE_HOST" "cd $REMOTE_DIR && cp .env.example .env"
    echo -e "${RED}⚠ IMPORTANT: Edit .env file on VPS with your credentials!${NC}"
    echo "Run: ssh $REMOTE_HOST 'nano $REMOTE_DIR/.env'"
    read -p "Press Enter after you've configured .env..."
fi

# Step 7: Restart PM2
echo -e "${YELLOW}[7/7] Restarting PM2 processes...${NC}"
ssh "$REMOTE_HOST" << 'ENDSSH'
cd /var/www/discord-bot

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "PM2 not found, installing..."
    sudo npm install -g pm2
fi

# Start or restart processes
if pm2 list | grep -q "shitfucks-bot"; then
    echo "Restarting existing PM2 processes..."
    pm2 restart ecosystem.config.js
else
    echo "Starting PM2 processes for the first time..."
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup
fi

# Show status
pm2 status
ENDSSH

echo
echo -e "${GREEN}====================================${NC}"
echo -e "${GREEN}✓ Deployment Complete!${NC}"
echo -e "${GREEN}====================================${NC}"
echo
echo -e "${BLUE}Next steps:${NC}"
echo "1. Check logs: ssh $REMOTE_HOST 'pm2 logs'"
echo "2. Test API: curl http://YOUR-VPS-IP:3001/api/health"
echo "3. Check Discord bot is online in your server"
echo
echo -e "${BLUE}Useful commands:${NC}"
echo "  ssh $REMOTE_HOST 'pm2 status'        # Check PM2 status"
echo "  ssh $REMOTE_HOST 'pm2 logs'          # View logs"
echo "  ssh $REMOTE_HOST 'pm2 restart all'   # Restart processes"
echo

exit 0
