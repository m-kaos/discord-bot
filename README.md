# Shit Fucks Discord Bot

Production-ready Discord bot that tracks member presence, voice activity, and sends birthday notifications. Includes REST API for React frontend integration.

## Features

- ✅ Real-time member presence tracking (online/idle/dnd/offline)
- ✅ Voice channel monitoring (who's in voice, join/leave tracking)
- ✅ Server statistics (total members, online count, boost level)
- ✅ Daily birthday notifications to Discord channel
- ✅ REST API for React app integration
- ✅ In-memory caching for fast data access
- ✅ Production-ready with PM2 process management

## Tech Stack

- **Discord.js v14** - Discord API wrapper
- **Express.js** - REST API server
- **node-cron** - Scheduled birthday checks
- **PM2** - Process manager for production

## Project Structure

```
discord-bot/
├── src/
│   ├── bot.js              # Main Discord bot
│   ├── api.js              # Express REST API
│   ├── cache.js            # In-memory data cache
│   ├── config.js           # Birthday list & settings
│   ├── events/             # Discord event handlers
│   │   ├── ready.js
│   │   ├── presenceUpdate.js
│   │   ├── voiceStateUpdate.js
│   │   └── guildMemberUpdate.js
│   └── utils/              # Utility functions
│       ├── logger.js
│       └── birthdayChecker.js
├── logs/                   # PM2 logs (created automatically)
├── .env                    # Environment variables (create this)
├── .env.example            # Environment template
├── ecosystem.config.js     # PM2 configuration
└── package.json
```

## Setup Instructions

### 1. Discord Developer Portal Setup

1. Go to https://discord.com/developers/applications
2. Click "New Application" and give it a name
3. Go to "Bot" section:
   - Click "Add Bot"
   - Copy the bot token (save for later)
   - Enable these privileged intents:
     - ✅ PRESENCE INTENT
     - ✅ SERVER MEMBERS INTENT
     - ✅ MESSAGE CONTENT INTENT
4. Go to "OAuth2" → "URL Generator":
   - Select scopes: `bot`
   - Select bot permissions:
     - Read Messages/View Channels
     - Send Messages
     - Read Message History
   - Copy the generated URL and invite bot to your server

### 2. Get Your Server/Channel IDs

1. Enable Developer Mode in Discord (Settings → Advanced → Developer Mode)
2. Right-click your server → Copy ID (this is your `GUILD_ID`)
3. Right-click the channel for birthday announcements → Copy ID (this is `BIRTHDAY_CHANNEL_ID`)

### 3. Local Development Setup

```bash
# Clone/download this project
cd discord-bot

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your values
nano .env
```

**Required `.env` variables:**
```bash
DISCORD_TOKEN=your_bot_token_from_step_1
GUILD_ID=your_server_id_from_step_2
BIRTHDAY_CHANNEL_ID=channel_id_for_birthdays_from_step_2
API_PORT=3001
ALLOWED_ORIGINS=http://localhost:3000
TZ=America/Mexico_City
```

**Optional `.env` variables:**
```bash
API_KEY=some_secret_key_for_api_auth  # Optional API key authentication
NODE_ENV=development
```

### 4. Run Locally for Testing

```bash
# Run bot only
npm start

# Or run with nodemon (auto-restart on changes)
npm run dev
```

The bot will start and the API will be available at `http://localhost:3001`

### 5. Test API Endpoints

```bash
# Health check
curl http://localhost:3001/api/health

# Get all members
curl http://localhost:3001/api/members

# Get online members
curl http://localhost:3001/api/members/online

# Get server stats
curl http://localhost:3001/api/stats

# Get voice channels
curl http://localhost:3001/api/voice

# Get birthdays
curl http://localhost:3001/api/birthdays/upcoming
```

## Production Deployment (Ubuntu VPS)

### Prerequisites on VPS:
- Node.js 18+ installed
- PM2 installed globally (`npm install -g pm2`)
- Nginx installed (optional, for reverse proxy)

### Deployment Steps:

```bash
# 1. SSH into your VPS
ssh user@your-vps-ip

# 2. Create project directory
sudo mkdir -p /var/www/discord-bot
sudo chown $USER:$USER /var/www/discord-bot
cd /var/www/discord-bot

# 3. Upload files (use scp, git, or rsync)
# Example with scp from local machine:
scp -r /path/to/discord-bot/* user@your-vps-ip:/var/www/discord-bot/

# 4. Install dependencies
npm install --production

# 5. Create logs directory
mkdir logs

# 6. Create .env file
nano .env
# Paste your production environment variables

# 7. Start with PM2
pm2 start ecosystem.config.js

# 8. Save PM2 configuration
pm2 save

# 9. Setup PM2 to start on boot
pm2 startup
# Copy and run the command it gives you

# 10. Check status
pm2 status
pm2 logs shitfucks-bot
pm2 logs shitfucks-api
```

### Firewall Configuration

```bash
# Allow API port (if accessing directly)
sudo ufw allow 3001/tcp

# Or use Nginx reverse proxy (recommended)
```

### Optional: Nginx Reverse Proxy

Create `/etc/nginx/sites-available/discord-api`:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;  # Or your VPS IP

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/discord-api /etc/nginx/sites-enabled/

# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### Optional: SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

## API Endpoints Reference

### Health & Status
- `GET /api/health` - API health check and cache stats

### Members
- `GET /api/members` - All server members with presence
- `GET /api/members/online` - Only online members
- `GET /api/members/:userId` - Specific member by ID

### Server Stats
- `GET /api/stats` - Server statistics (total, online, boosts)

### Voice Channels
- `GET /api/voice` - All active voice channels
- `GET /api/voice/:channelId` - Specific voice channel info

### Birthdays
- `GET /api/birthdays` - All birthdays sorted by next occurrence
- `GET /api/birthdays/upcoming?days=7` - Upcoming birthdays (default 7 days)
- `GET /api/birthdays/today` - Birthdays today
- `POST /api/birthdays/check` - Manually trigger birthday check

## PM2 Commands

```bash
# View status
pm2 status

# View logs
pm2 logs
pm2 logs shitfucks-bot
pm2 logs shitfucks-api

# Restart
pm2 restart all
pm2 restart shitfucks-bot

# Stop
pm2 stop all

# Monitor
pm2 monit

# Delete from PM2
pm2 delete all
```

## Updating Birthday List

Edit `src/config.js` and add/modify birthdays:

```javascript
const birthdays = [
  { name: 'John', month: 1, day: 15 },
  { name: 'Jane', month: 6, day: 30 },
  // Add more...
];
```

Then restart the bot:
```bash
pm2 restart shitfucks-bot
```

## Troubleshooting

### Bot not connecting to Discord
- Check `DISCORD_TOKEN` in `.env`
- Verify bot is invited to server
- Check intents are enabled in Developer Portal

### API not accessible
- Check firewall allows port 3001
- Verify `API_PORT` in `.env`
- Check `ALLOWED_ORIGINS` includes your frontend URL

### Birthday notifications not working
- Verify `BIRTHDAY_CHANNEL_ID` is correct
- Check bot has Send Messages permission in that channel
- Check timezone (`TZ` in `.env`)
- Manually trigger: `curl -X POST http://localhost:3001/api/birthdays/check`

### Voice tracking not working
- Verify `GuildVoiceStates` intent is enabled
- Check bot has View Channels permission for voice channels

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DISCORD_TOKEN` | ✅ Yes | - | Bot token from Discord Developer Portal |
| `GUILD_ID` | ✅ Yes | - | Your Discord server ID |
| `BIRTHDAY_CHANNEL_ID` | ✅ Yes | - | Channel ID for birthday announcements |
| `API_PORT` | No | 3001 | Port for REST API server |
| `API_KEY` | No | - | Optional API key for authentication |
| `ALLOWED_ORIGINS` | No | localhost:3000 | Comma-separated list of allowed CORS origins |
| `TZ` | No | America/Mexico_City | Timezone for birthday checks |
| `NODE_ENV` | No | production | Node environment (development/production) |

## Support

For issues or questions, check the logs:
```bash
pm2 logs shitfucks-bot --lines 100
pm2 logs shitfucks-api --lines 100
```

## License

MIT
