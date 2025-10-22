# 🚀 Discord Bot - Ready for Deployment!

## ✅ What's Been Built

A complete, production-ready Discord bot system with:

### Core Features
- ✅ Real-time member presence tracking (online/idle/dnd/offline)
- ✅ Voice channel monitoring with join/leave tracking
- ✅ Server statistics (members, online count, boost level)
- ✅ Daily birthday notifications (cron-scheduled)
- ✅ REST API with 14+ endpoints
- ✅ **Auto-deployment from GitHub** (webhook integration)
- ✅ In-memory caching for fast performance
- ✅ PM2 process management
- ✅ Complete logging system
- ✅ Security (CORS, rate limiting, optional API auth)

### Project Structure
```
discord-bot/
├── src/
│   ├── bot.js                      # Discord client
│   ├── api.js                      # REST API + webhook endpoint
│   ├── cache.js                    # In-memory storage
│   ├── config.js                   # Birthday list
│   ├── events/                     # 4 Discord event handlers
│   └── utils/                      # Logger, birthday checker
├── package.json                    # Dependencies
├── ecosystem.config.js             # PM2 config
├── auto-deploy.sh                  # Auto-deployment script ✨
├── .env.example                    # Environment template
├── VPS-CLAUDE-CONTEXT.md          # Full context for VPS Claude ✨
├── SETUP-GUIDE.md                  # Quick setup instructions
└── README.md                       # Complete documentation
```

## 📦 GitHub Repository Setup

### Step 1: Push to GitHub

```bash
cd c:\Users\Mauricio\Workspace\PERSONAL\discord-bot

# Initialize git (if not done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Discord bot with auto-deployment"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/discord-bot.git

# Push
git push -u origin main
```

### Step 2: Configure GitHub Webhook

**After pushing to GitHub:**

1. Go to your GitHub repo
2. Click **Settings** → **Webhooks** → **Add webhook**
3. Configure:
   - **Payload URL:** `http://YOUR_VPS_IP:3001/api/webhook/deploy`
   - **Content type:** `application/json`
   - **Secret:** (create a strong random secret)
   - **Events:** Select "Just the `push` event"
   - **Active:** ✓ Check this
4. Click **Add webhook**

**Save your webhook secret** - you'll need it for the `.env` file on VPS!

## 🖥️ VPS Deployment Instructions

### For the Claude Instance on VPS:

1. **Share the comprehensive context:**
   - File: `VPS-CLAUDE-CONTEXT.md` contains EVERYTHING Claude needs

2. **Tell VPS Claude:**
   ```
   I need you to deploy a Discord bot from GitHub with auto-deployment support.

   Repository: https://github.com/YOUR_USERNAME/discord-bot

   Read the VPS-CLAUDE-CONTEXT.md file in the repository for complete instructions.

   You'll need to ask me for:
   - Discord bot token
   - Discord guild ID
   - Birthday channel ID
   - GitHub webhook secret

   Follow all steps in the context document and report back when done!
   ```

3. **Claude will:**
   - Clone the repo
   - Install dependencies
   - Guide you through `.env` setup
   - Configure PM2
   - Setup firewall
   - Test all endpoints
   - Verify auto-deployment works

## 🔑 Information You'll Need for VPS

Have these ready when setting up on VPS:

### Discord Info:
- [ ] **Bot Token** (from https://discord.com/developers/applications)
- [ ] **Guild ID** (right-click server → Copy ID)
- [ ] **Birthday Channel ID** (right-click channel → Copy ID)

### GitHub Info:
- [ ] **Repository URL** (e.g., `https://github.com/yourname/discord-bot.git`)
- [ ] **Webhook Secret** (from GitHub webhook settings)

### Optional:
- [ ] **API Key** (for API authentication - can generate random string)
- [ ] **Frontend URL** (for CORS - your React app URL)

## 🧪 Testing Auto-Deployment

Once deployed on VPS:

```bash
# 1. Make a test change locally
echo "# Test change" >> README.md

# 2. Commit and push
git add .
git commit -m "Test auto-deployment"
git push

# 3. Check VPS logs (via SSH or ask VPS Claude)
pm2 logs shitfucks-api | grep webhook
tail -f /var/www/discord-bot/logs/deploy.log

# 4. Verify deployment ran
curl http://YOUR_VPS_IP:3001/api/health
```

**Expected result:** Bot automatically restarts with your changes!

## 📊 API Endpoints Reference

Once deployed, these will be available:

```bash
BASE_URL=http://YOUR_VPS_IP:3001

# Health check
GET $BASE_URL/api/health

# Members
GET $BASE_URL/api/members
GET $BASE_URL/api/members/online
GET $BASE_URL/api/members/:userId

# Stats
GET $BASE_URL/api/stats

# Voice
GET $BASE_URL/api/voice
GET $BASE_URL/api/voice/:channelId

# Birthdays
GET $BASE_URL/api/birthdays
GET $BASE_URL/api/birthdays/upcoming?days=7
GET $BASE_URL/api/birthdays/today
POST $BASE_URL/api/birthdays/check

# Webhook (GitHub only)
POST $BASE_URL/api/webhook/deploy
```

## 🔄 How Auto-Deployment Works

```
┌─────────────────┐
│  Push to GitHub │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ GitHub sends webhook│
│ to VPS:3001/api/... │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ API verifies secret │
│ & triggers script   │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  auto-deploy.sh     │
│  - git pull         │
│  - npm install      │
│  - pm2 restart      │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Bot restarted with  │
│ latest code! 🎉     │
└─────────────────────┘
```

## 🛠️ Maintenance

### View Logs
```bash
pm2 logs shitfucks-bot    # Bot logs
pm2 logs shitfucks-api    # API logs
tail -f logs/deploy.log   # Deployment logs
```

### Restart Services
```bash
pm2 restart all
pm2 restart shitfucks-bot
```

### Update Birthday List
1. Edit `src/config.js` locally
2. Commit and push
3. Auto-deployment will update it!

### Manual Deployment
```bash
ssh user@vps
cd /var/www/discord-bot
git pull
npm install --production
pm2 restart all
```

## ✅ Deployment Checklist

Before asking VPS Claude to deploy:

- [ ] Code pushed to GitHub
- [ ] GitHub webhook configured
- [ ] Webhook secret saved
- [ ] Discord bot created in Developer Portal
- [ ] Bot invited to Discord server
- [ ] All 3 intents enabled (PRESENCE, SERVER MEMBERS, MESSAGE CONTENT)
- [ ] Have Discord IDs ready (guild, channel)

After VPS Claude deploys:

- [ ] Bot shows online in Discord
- [ ] API responds to /health endpoint
- [ ] PM2 shows 2 processes running
- [ ] Test auto-deploy (make commit, push, verify restart)
- [ ] Birthday check works (manual trigger)
- [ ] Voice tracking works (join channel, check API)
- [ ] Frontend can access API (CORS check)

## 🎯 Next Steps

1. ✅ Push code to GitHub
2. ✅ Configure GitHub webhook
3. ✅ Deploy to VPS (use VPS-CLAUDE-CONTEXT.md)
4. ✅ Test all features
5. 🔄 Update React frontend to use API
6. 🚀 Enjoy automated deployments!

## 📝 Notes

- **Auto-deploy only triggers on push to `main` branch**
- **Deployment takes ~10-30 seconds** (git pull + npm install + restart)
- **Webhook endpoint has no auth** (but verifies GitHub signature if secret set)
- **PM2 auto-restarts** bot on crashes
- **Logs rotate automatically** with pm2-logrotate

## 🆘 Troubleshooting

### Webhook not triggering?
- Check GitHub webhook deliveries (Settings → Webhooks → Recent Deliveries)
- Verify firewall allows port 3001
- Check signature matches (webhook secret in .env)

### Deployment fails?
- Check `logs/deploy.log`
- Ensure `auto-deploy.sh` is executable: `chmod +x auto-deploy.sh`
- Verify git can pull without password (use SSH keys or PAT)

### Bot offline after deploy?
- Check PM2 logs: `pm2 logs shitfucks-bot`
- Verify .env file has correct values
- Restart manually: `pm2 restart shitfucks-bot`

---

**You're all set! The bot is ready for production deployment with auto-deployment from GitHub! 🚀**

When you're ready, just share `VPS-CLAUDE-CONTEXT.md` with the VPS Claude instance and it will handle everything!
