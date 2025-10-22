# Quick Reference Card

## 🚀 One-Line Commands

### Local Development
```bash
npm install              # Install dependencies
npm start                # Run bot and API
npm run dev              # Run with auto-restart (nodemon)
start-dev.bat            # Windows quick start
```

### VPS Deployment
```bash
pm2 start ecosystem.config.js    # Start both processes
pm2 restart all                  # Restart everything
pm2 stop all                     # Stop everything
pm2 delete all                   # Remove from PM2
pm2 status                       # Show status
pm2 logs                         # View all logs
pm2 logs shitfucks-bot          # View bot logs only
pm2 logs shitfucks-api          # View API logs only
pm2 monit                        # Real-time monitor
pm2 save                         # Save current state
pm2 startup                      # Enable auto-start on boot
```

### Testing API
```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/members/online
curl http://localhost:3001/api/stats
curl http://localhost:3001/api/voice
curl http://localhost:3001/api/birthdays/upcoming
curl -X POST http://localhost:3001/api/birthdays/check
```

### Git & Deployment
```bash
git add .
git commit -m "message"
git push                         # Triggers auto-deploy if webhook configured

# Manual deploy on VPS
ssh user@vps "cd /var/www/discord-bot && git pull && npm install && pm2 restart all"
```

### Deployment Logs
```bash
tail -f logs/deploy.log          # Watch deployment logs
tail -f logs/bot-out.log         # Watch bot output
tail -f logs/api-out.log         # Watch API output
```

## 📋 Environment Variables Quick List

```env
# Required
DISCORD_TOKEN=
GUILD_ID=
BIRTHDAY_CHANNEL_ID=

# Optional but recommended
API_PORT=3001
ALLOWED_ORIGINS=http://localhost:3000
TZ=America/Mexico_City
GITHUB_WEBHOOK_SECRET=
API_KEY=
```

## 🔧 Troubleshooting One-Liners

```bash
# Check if bot is running
ps aux | grep bot.js

# Check if API is running
ps aux | grep api.js
netstat -tlnp | grep 3001

# Kill stuck processes
pkill -f bot.js
pkill -f api.js

# Check disk space
df -h
du -sh /var/www/discord-bot

# Check firewall
sudo ufw status
sudo ufw allow 3001/tcp

# Check logs for errors
pm2 logs --err --lines 50

# Restart Nginx
sudo systemctl restart nginx
sudo nginx -t
```

## 📞 API Endpoints Cheat Sheet

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/members` | All members |
| GET | `/api/members/online` | Online members only |
| GET | `/api/members/:id` | Specific member |
| GET | `/api/stats` | Server statistics |
| GET | `/api/voice` | Voice channels |
| GET | `/api/voice/:id` | Specific voice channel |
| GET | `/api/birthdays` | All birthdays |
| GET | `/api/birthdays/upcoming` | Next 7 days |
| GET | `/api/birthdays/today` | Today's birthdays |
| POST | `/api/birthdays/check` | Trigger check |
| POST | `/api/webhook/deploy` | GitHub webhook |

## 🎯 Common Tasks

### Add a birthday
Edit `src/config.js`:
```javascript
{ name: 'NewPerson', month: 6, day: 15 },
```
Commit, push → auto-deploys!

### Change timezone
Edit `.env`:
```env
TZ=America/Los_Angeles
```
Restart: `pm2 restart all`

### Enable API authentication
Edit `.env`:
```env
API_KEY=your_secret_key_here
```
Use in requests: `curl -H "x-api-key: your_secret_key_here" ...`

### View who's online right now
```bash
curl http://localhost:3001/api/members/online | jq
```

### Test birthday notification
```bash
curl -X POST http://localhost:3001/api/birthdays/check
```

### Check deployment log
```bash
tail -20 logs/deploy.log
```

## 🔐 Security Checklist

```bash
# Set .env permissions
chmod 600 .env

# Make deploy script executable
chmod +x auto-deploy.sh

# Enable firewall
sudo ufw enable
sudo ufw allow 22,80,443,3001/tcp

# Check running processes
pm2 list

# Verify no secrets in logs
grep -i "token\|secret\|password" logs/*.log
```

## 📊 Monitoring Commands

```bash
# System resources
htop
free -h
df -h

# PM2 metrics
pm2 monit

# Network
netstat -tlnp | grep LISTEN
ss -tulpn | grep :3001

# Logs in real-time
pm2 logs --lines 0 | grep -i error
tail -f logs/api-out.log | grep API
```

## ⚡ Emergency Commands

```bash
# Bot crashed? Restart everything
pm2 restart all

# Out of memory?
pm2 restart all && pm2 flush

# Deployment stuck?
pm2 restart shitfucks-api

# Complete reset
pm2 delete all
rm -rf node_modules logs
npm install
pm2 start ecosystem.config.js
pm2 save

# Rollback to previous commit
git reset --hard HEAD~1
pm2 restart all
```

## 🎨 Pretty Log Viewing

```bash
# Colorized logs
pm2 logs --lines 50

# Only errors
pm2 logs --err

# Specific process
pm2 logs shitfucks-bot --lines 100

# JSON format
pm2 jlist

# Follow logs
pm2 logs --raw | grep -i "online\|voice\|birthday"
```

---

**Bookmark this file for quick reference! 📌**
