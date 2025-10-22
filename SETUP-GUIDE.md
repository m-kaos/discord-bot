# Quick Setup Guide

## 🚀 Fastest Way to Get Started

### Step 1: Discord Developer Portal (5 minutes)

1. Go to https://discord.com/developers/applications
2. Click **"New Application"** → Name it "Shit Fucks Bot"
3. Go to **"Bot"** tab:
   - Click **"Add Bot"**
   - Copy the **Token** (you'll need this)
   - Scroll down to **"Privileged Gateway Intents"**:
     - ✅ Enable **PRESENCE INTENT**
     - ✅ Enable **SERVER MEMBERS INTENT**
     - ✅ Enable **MESSAGE CONTENT INTENT**
4. Go to **"OAuth2"** → **"URL Generator"**:
   - Scopes: Check ✅ **bot**
   - Bot Permissions: Check ✅ **Send Messages**, ✅ **View Channels**, ✅ **Read Message History**
   - Copy the generated URL at the bottom
5. Open the URL in browser → Select your server → **Authorize**

### Step 2: Get Discord IDs (2 minutes)

1. In Discord, go to **Settings** → **Advanced** → Enable **Developer Mode**
2. Right-click your server name → **Copy ID** (this is `GUILD_ID`)
3. Right-click the channel where you want birthday announcements → **Copy ID** (this is `BIRTHDAY_CHANNEL_ID`)

### Step 3: Configure Bot Locally (2 minutes)

```bash
cd c:\Users\Mauricio\Workspace\PERSONAL\discord-bot

# Copy environment template
copy .env.example .env

# Edit .env file (use notepad or VS Code)
notepad .env
```

Paste in your values:
```env
DISCORD_TOKEN=YOUR_BOT_TOKEN_FROM_STEP_1
GUILD_ID=YOUR_SERVER_ID
BIRTHDAY_CHANNEL_ID=YOUR_CHANNEL_ID
API_PORT=3001
ALLOWED_ORIGINS=http://localhost:3000,https://yourapp.com
TZ=America/Mexico_City
```

Save and close.

### Step 4: Install & Run (2 minutes)

```bash
# Install dependencies
npm install

# Run the bot!
npm start
```

**OR** on Windows, just double-click: `start-dev.bat`

### Step 5: Test It Works

1. Check Discord - bot should show as **Online** ✅
2. Open browser: http://localhost:3001/api/health
3. Should see:
   ```json
   {
     "status": "healthy",
     "timestamp": "...",
     "cache": { ... }
   }
   ```

🎉 **You're done! Bot is running locally.**

---

## 📤 Deploy to Your VPS (Ubuntu)

### Prerequisites on VPS:
```bash
# SSH into VPS
ssh user@your-vps-ip

# Install Node.js 18+ (if not installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install git (if using git)
sudo apt install -y git
```

### Option A: Deploy with Script (Easiest)

**On your Windows machine:**
```bash
# Make script executable (if on Git Bash/WSL)
chmod +x deploy.sh

# Run deployment
./deploy.sh user@your-vps-ip
```

The script will:
- Upload all files
- Install dependencies
- Start PM2
- Show you status

### Option B: Manual Deployment

```bash
# 1. SSH into VPS
ssh user@your-vps-ip

# 2. Create directory
sudo mkdir -p /var/www/discord-bot
sudo chown $USER:$USER /var/www/discord-bot

# 3. Upload files (from Windows, use WinSCP, FileZilla, or scp)
# OR clone from git:
cd /var/www
git clone YOUR_REPO_URL discord-bot

# 4. Install dependencies
cd /var/www/discord-bot
npm install --production

# 5. Create .env
nano .env
# Paste your production values (same as Step 3)

# 6. Create logs directory
mkdir logs

# 7. Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow instructions it gives you

# 8. Check status
pm2 status
pm2 logs
```

### Configure Firewall

```bash
# Allow API port
sudo ufw allow 3001/tcp

# Check firewall status
sudo ufw status
```

### Test Production API

```bash
# From your local machine
curl http://YOUR-VPS-IP:3001/api/health

# Should return JSON with status
```

---

## 🔧 Common Issues & Solutions

### Bot shows offline
**Check:**
1. Is `DISCORD_TOKEN` correct in `.env`?
2. Did you enable all 3 privileged intents in Developer Portal?
3. Is bot invited to your server?

**Fix:**
```bash
pm2 logs shitfucks-bot --lines 50
# Check for authentication errors
```

### API not accessible
**Check:**
1. Is port 3001 open? `sudo ufw allow 3001/tcp`
2. Is process running? `pm2 status`
3. Is `ALLOWED_ORIGINS` correct?

**Fix:**
```bash
pm2 logs shitfucks-api --lines 50
```

### Birthday notifications not sending
**Check:**
1. Is `BIRTHDAY_CHANNEL_ID` correct?
2. Does bot have Send Messages permission in that channel?
3. Is timezone (`TZ`) correct?

**Fix:**
```bash
# Manually trigger birthday check
curl -X POST http://localhost:3001/api/birthdays/check

# Check specific date
curl http://localhost:3001/api/birthdays/today
```

### Voice tracking not working
**Check:**
1. Did you enable `GUILD_PRESENCES` intent?
2. Does bot have View Channels permission?

**Fix:**
Restart bot after enabling intents:
```bash
pm2 restart shitfucks-bot
```

---

## 📊 API Endpoints Quick Reference

```bash
# Health check
GET /api/health

# Get all members
GET /api/members

# Get online members only
GET /api/members/online

# Get server stats
GET /api/stats

# Get voice channels
GET /api/voice

# Get birthdays
GET /api/birthdays/upcoming?days=7
GET /api/birthdays/today

# Trigger birthday check
POST /api/birthdays/check
```

---

## 🛠️ Useful PM2 Commands

```bash
# View all processes
pm2 status

# View logs
pm2 logs                    # All logs
pm2 logs shitfucks-bot      # Bot logs only
pm2 logs shitfucks-api      # API logs only

# Restart
pm2 restart all
pm2 restart shitfucks-bot

# Stop
pm2 stop all

# Monitor in real-time
pm2 monit

# Save current state
pm2 save

# View detailed info
pm2 info shitfucks-bot
```

---

## 📝 Next Steps

1. ✅ Bot is running
2. ✅ API is accessible
3. **Now**: Update React app to use the API!

See the main README.md for React integration instructions.

---

## 🆘 Need Help?

Check logs:
```bash
pm2 logs shitfucks-bot --lines 100
pm2 logs shitfucks-api --lines 100
```

Test endpoints:
```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/members/online
```

Restart everything:
```bash
pm2 restart all
```
