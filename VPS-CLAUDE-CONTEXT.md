# Context for VPS Claude Instance - Discord Bot Deployment

## 🎯 Your Mission

You are a Claude instance running on an Ubuntu 22 VPS. Your job is to:
1. Deploy the Discord bot + API to production
2. Set up GitHub webhook for auto-deployment on push
3. Configure everything to run 24/7 with PM2
4. Ensure the API is accessible from the React frontend

## 📋 Server Information

**OS:** Ubuntu 22.04
**Already Installed:**
- Node.js
- PM2
- Nginx

**User:** Has full sudo access
**Working Directory:** `/var/www/discord-bot` (or similar)

## 🗂️ Project Overview

This is a production-ready Discord bot system that:
- Tracks Discord server members' online status
- Monitors voice channel activity
- Sends birthday notifications daily
- Exposes REST API for React frontend integration

**Tech Stack:**
- Discord.js v14
- Express.js REST API
- node-cron for scheduled tasks
- PM2 for process management
- In-memory data storage (no database)

## 📁 File Structure

```
discord-bot/
├── src/
│   ├── bot.js              # Main Discord bot client
│   ├── api.js              # Express REST API server
│   ├── cache.js            # In-memory cache for Discord data
│   ├── config.js           # Birthday list and settings
│   ├── events/             # Discord event handlers
│   │   ├── ready.js
│   │   ├── presenceUpdate.js
│   │   ├── voiceStateUpdate.js
│   │   └── guildMemberUpdate.js
│   └── utils/
│       ├── logger.js
│       └── birthdayChecker.js
├── package.json
├── ecosystem.config.js     # PM2 configuration
├── .env.example            # Environment template
└── README.md
```

## 🔧 Setup Tasks

### Task 1: Initial Deployment

**Steps:**
1. Clone the repository to `/var/www/discord-bot`
2. Install dependencies: `npm install --production`
3. Create `.env` file from `.env.example`
4. Create `logs/` directory
5. Start with PM2: `pm2 start ecosystem.config.js`
6. Save PM2 config: `pm2 save`
7. Setup PM2 startup: `pm2 startup` (run the command it gives)
8. Test API: `curl http://localhost:3001/api/health`

**Expected Result:**
- Bot shows online in Discord
- API responds on port 3001
- PM2 shows 2 processes running (bot + api)

### Task 2: Environment Variables Setup

**Required `.env` variables to ask user for:**

```env
# Discord Bot Configuration (REQUIRED - ASK USER)
DISCORD_TOKEN=                    # Bot token from Discord Developer Portal
GUILD_ID=                         # Discord server ID
BIRTHDAY_CHANNEL_ID=              # Channel ID for birthday announcements

# API Configuration (DEFAULTS PROVIDED)
API_PORT=3001                     # Can keep default
ALLOWED_ORIGINS=http://localhost:3000,https://USER_FRONTEND_DOMAIN
API_KEY=                          # Optional - ask if they want API auth
TZ=America/Mexico_City            # Ask for timezone

# Environment
NODE_ENV=production
```

**How to get Discord values (tell user):**
1. **DISCORD_TOKEN:**
   - Go to https://discord.com/developers/applications
   - Select application → Bot → Copy Token
   - Enable intents: PRESENCE, SERVER MEMBERS, MESSAGE CONTENT

2. **GUILD_ID:**
   - Discord → Enable Developer Mode (Settings → Advanced)
   - Right-click server → Copy ID

3. **BIRTHDAY_CHANNEL_ID:**
   - Right-click desired channel → Copy ID

### Task 3: Firewall Configuration

```bash
# Allow API port
sudo ufw allow 3001/tcp

# Check firewall status
sudo ufw status

# If firewall not enabled, enable it
sudo ufw enable
```

### Task 4: GitHub Auto-Deployment Webhook

**Goal:** Automatically pull latest changes and restart when code is pushed to GitHub.

**Implementation Options:**

#### Option A: GitHub Webhook + Simple Endpoint (Recommended)

**Steps:**

1. **Create webhook endpoint in API** (`src/api.js`):

Add this endpoint to the Express app:

```javascript
// GitHub Webhook Handler
app.post('/api/webhook/deploy', express.json(), (req, res) => {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  // Verify webhook secret (optional but recommended)
  if (secret) {
    const signature = req.headers['x-hub-signature-256'];
    const crypto = require('crypto');
    const hash = 'sha256=' + crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== hash) {
      logger.warn('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }
  }

  logger.info('Received GitHub webhook, starting deployment...');

  // Run deployment script
  const { exec } = require('child_process');
  exec('/var/www/discord-bot/auto-deploy.sh', (error, stdout, stderr) => {
    if (error) {
      logger.error('Deployment failed:', error);
    } else {
      logger.success('Deployment completed:', stdout);
    }
  });

  res.json({ status: 'deployment triggered' });
});
```

2. **Create auto-deployment script** (`auto-deploy.sh`):

```bash
#!/bin/bash
# Auto-deployment script triggered by GitHub webhook

set -e

DEPLOY_DIR="/var/www/discord-bot"
LOG_FILE="$DEPLOY_DIR/logs/deploy.log"

echo "$(date): Starting auto-deployment" >> "$LOG_FILE"

cd "$DEPLOY_DIR"

# Pull latest changes
git pull origin main >> "$LOG_FILE" 2>&1

# Install/update dependencies
npm install --production >> "$LOG_FILE" 2>&1

# Restart PM2 processes
pm2 restart ecosystem.config.js >> "$LOG_FILE" 2>&1

echo "$(date): Deployment complete" >> "$LOG_FILE"

exit 0
```

Make it executable:
```bash
chmod +x /var/www/discord-bot/auto-deploy.sh
```

3. **Configure GitHub webhook:**
   - Go to your GitHub repo → Settings → Webhooks → Add webhook
   - Payload URL: `http://YOUR_VPS_IP:3001/api/webhook/deploy`
   - Content type: `application/json`
   - Secret: (optional, set in `.env` as `GITHUB_WEBHOOK_SECRET`)
   - Events: Select "Just the push event"
   - Active: ✓

4. **Test webhook:**
```bash
# Make a test commit and push
# Check logs:
pm2 logs shitfucks-api --lines 20
tail -f /var/www/discord-bot/logs/deploy.log
```

#### Option B: GitHub Actions (Alternative)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to VPS

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/discord-bot
            git pull origin main
            npm install --production
            pm2 restart ecosystem.config.js
```

Add secrets in GitHub repo:
- `VPS_HOST`: Your VPS IP
- `VPS_USER`: SSH username
- `SSH_PRIVATE_KEY`: Your private SSH key

### Task 5: Nginx Reverse Proxy (Optional but Recommended)

**Why:** Expose API on port 80/443 instead of 3001, add SSL support.

**Setup:**

Create `/etc/nginx/sites-available/discord-api`:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;  # Or VPS IP

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/m;

    location /api {
        limit_req zone=api_limit burst=10 nodelay;

        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint (no auth needed)
    location = /api/health {
        proxy_pass http://localhost:3001/api/health;
    }
}
```

Enable and test:
```bash
sudo ln -s /etc/nginx/sites-available/discord-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**Optional SSL with Let's Encrypt:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

### Task 6: Monitoring & Logging

**PM2 Monitoring:**
```bash
# View processes
pm2 status

# Monitor in real-time
pm2 monit

# View logs
pm2 logs
pm2 logs shitfucks-bot
pm2 logs shitfucks-api

# Flush old logs
pm2 flush
```

**Log Rotation:**
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

**Disk space monitoring:**
```bash
df -h
du -sh /var/www/discord-bot/logs
```

## 🧪 Testing Checklist

After deployment, verify:

- [ ] Bot shows as **online** in Discord server
- [ ] API health check works: `curl http://localhost:3001/api/health`
- [ ] Online members endpoint works: `curl http://localhost:3001/api/members/online`
- [ ] PM2 shows both processes running: `pm2 status`
- [ ] Logs are being written: `ls -lh logs/`
- [ ] Auto-deployment webhook works (make test commit)
- [ ] Birthday notification scheduled (check cron): `pm2 logs shitfucks-bot | grep birthday`
- [ ] Voice tracking works (join voice channel, check API)
- [ ] API accessible from frontend URL (CORS check)

## 🚨 Troubleshooting

### Bot won't connect to Discord
```bash
# Check token in .env
cat .env | grep DISCORD_TOKEN

# Check bot logs
pm2 logs shitfucks-bot --lines 50

# Common issues:
# - Invalid token
# - Missing intents in Discord Developer Portal
# - Bot not invited to server
```

### API not accessible
```bash
# Check if API is running
pm2 status
netstat -tlnp | grep 3001

# Check firewall
sudo ufw status

# Check logs
pm2 logs shitfucks-api --lines 50

# Test locally
curl http://localhost:3001/api/health
```

### Webhook not triggering
```bash
# Check webhook logs
tail -f /var/www/discord-bot/logs/deploy.log
pm2 logs shitfucks-api | grep webhook

# Test manually
./auto-deploy.sh

# Verify script is executable
ls -l auto-deploy.sh
```

### PM2 not starting on boot
```bash
# Re-run startup script
pm2 startup
pm2 save

# Check systemd service
systemctl status pm2-$USER
```

## 📊 Expected Endpoints

After deployment, these should work:

```bash
# Health check
curl http://YOUR_VPS_IP:3001/api/health

# Get online members
curl http://YOUR_VPS_IP:3001/api/members/online

# Get server stats
curl http://YOUR_VPS_IP:3001/api/stats

# Get voice channels
curl http://YOUR_VPS_IP:3001/api/voice

# Get upcoming birthdays
curl http://YOUR_VPS_IP:3001/api/birthdays/upcoming

# Trigger birthday check (POST)
curl -X POST http://YOUR_VPS_IP:3001/api/birthdays/check
```

## 🔐 Security Checklist

- [ ] `.env` file has proper permissions: `chmod 600 .env`
- [ ] Discord token not committed to git
- [ ] Firewall enabled: `sudo ufw status`
- [ ] API rate limiting enabled (in code)
- [ ] CORS properly configured (only allow your frontend domain)
- [ ] Optional: API key authentication enabled
- [ ] Webhook secret configured (if using GitHub webhooks)
- [ ] PM2 logs don't expose sensitive data

## 📝 Files to Create/Modify

**New files to create:**
1. `auto-deploy.sh` - Webhook deployment script
2. `.env` - Environment variables (from `.env.example`)
3. `logs/` directory
4. `/etc/nginx/sites-available/discord-api` (if using Nginx)

**Files to modify:**
1. `src/api.js` - Add webhook endpoint
2. `package.json` - Add `crypto` if not already there (built-in Node module)

## 🎯 Success Criteria

Deployment is successful when:
1. ✅ Bot online in Discord for 24+ hours
2. ✅ API responds to all endpoints
3. ✅ PM2 shows both processes with 0 restarts
4. ✅ Auto-deployment works on git push
5. ✅ Birthday notification sent successfully (test manually)
6. ✅ Voice tracking updates in real-time
7. ✅ Frontend can fetch data from API
8. ✅ No errors in PM2 logs

## 💡 Tips for Claude Instance

1. **Ask user for missing info** (Discord token, guild ID, etc.)
2. **Test each step** before moving to next
3. **Check logs frequently**: `pm2 logs`
4. **Use `sudo` when needed** for system operations
5. **Verify file permissions** especially for `.env` and scripts
6. **Create backups** before making changes: `cp .env .env.backup`
7. **Document any issues** encountered and solutions

## 📞 What to Report Back

After deployment, provide:
1. ✅ Deployment status (success/failure)
2. 📋 Any errors encountered and how you fixed them
3. 🔗 API URL for testing (e.g., `http://VPS_IP:3001/api/health`)
4. 📊 Output of `pm2 status`
5. 🔄 Confirmation that auto-deployment webhook works
6. ⚠️ Any security recommendations
7. 📝 Next steps for user (e.g., update React frontend with API URL)

## 🚀 Quick Start Commands

```bash
# 1. Clone repo
cd /var/www
git clone YOUR_REPO_URL discord-bot
cd discord-bot

# 2. Install dependencies
npm install --production

# 3. Setup environment
cp .env.example .env
nano .env  # Fill in values

# 4. Create logs dir
mkdir -p logs

# 5. Make deploy script executable
chmod +x auto-deploy.sh

# 6. Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Run the command it outputs

# 7. Test
curl http://localhost:3001/api/health

# 8. Configure firewall
sudo ufw allow 3001/tcp

# 9. Setup webhook (optional)
# Add endpoint to src/api.js
# Configure on GitHub

# 10. Setup Nginx (optional)
sudo nano /etc/nginx/sites-available/discord-api
# Paste config from Task 5
sudo ln -s /etc/nginx/sites-available/discord-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 📚 Additional Resources

- [Discord.js Guide](https://discordjs.guide/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Express.js API Reference](https://expressjs.com/en/api.html)
- [Nginx Reverse Proxy Guide](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)
- [GitHub Webhooks Guide](https://docs.github.com/en/webhooks)

## ⚡ One-Liner Commands

```bash
# View all logs
pm2 logs --lines 100

# Restart everything
pm2 restart all

# Check system resources
htop

# Check disk space
df -h

# Find process using port
sudo lsof -i :3001

# Test webhook locally
bash -x ./auto-deploy.sh

# Monitor API requests
tail -f logs/api-out.log | grep API
```

---

**Good luck, VPS Claude! You got this! 🚀**
