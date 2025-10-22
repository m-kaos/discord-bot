# Cache Fix Deployment Instructions

## Problem Fixed
The bot and API were running as separate PM2 processes, so they couldn't share the in-memory cache. The API was returning empty data even though the bot had cached 94 members with 8 online.

## Solution
Modified `bot.js` to start the API server internally after the bot connects to Discord. Now both share the same memory space and can access the cache.

## Changes Made:
1. **src/bot.js** - Added API server startup after bot ready event
2. **ecosystem.config.js** - Removed separate API process (bot now runs both)

---

## Deployment Steps:

### 1. Commit and Push Changes
```bash
cd c:\Users\Mauricio\Workspace\PERSONAL\discord-bot
git add src/bot.js ecosystem.config.js DEPLOY-CACHE-FIX.md
git commit -m "Fix: Bot and API now share memory space for cache access"
git push origin master
```

This will trigger the auto-deploy webhook on the VPS.

### 2. Stop the Old Separate API Process
After the webhook deploys, SSH into VPS:
```bash
ssh vps
cd /var/www/discord-bot

# Stop and delete the old separate API process
pm2 delete shitfucks-api

# Restart the bot (which now includes the API)
pm2 restart shitfucks-bot

# Check status
pm2 status
```

You should see only **one process** now: `shitfucks-bot`

### 3. Verify It's Working
```bash
# Check bot logs - should see "Bot ready, starting API server..."
pm2 logs shitfucks-bot --lines 20

# Test the API endpoint
curl http://localhost:3001/api/members/online

# Should return members with success:true and count > 0
```

### 4. Test from React App
- Refresh your React app (F5)
- Right panel should show online members with avatars
- Bot Config page should show server stats

---

## Expected PM2 Output:

**Before:**
```
┌────┬───────────────────┬─────────┬─────────┬──────────┐
│ id │ name              │ status  │ cpu     │ mem      │
├────┼───────────────────┼─────────┼─────────┼──────────┤
│ 1  │ shitfucks-bot     │ online  │ 0%      │ 90.2mb   │
│ 2  │ shitfucks-api     │ online  │ 0%      │ 56.1mb   │ ← Delete this
└────┴───────────────────┴─────────┴─────────┴──────────┘
```

**After:**
```
┌────┬───────────────────┬─────────┬─────────┬──────────┐
│ id │ name              │ status  │ cpu     │ mem      │
├────┼───────────────────┼─────────┼─────────┼──────────┤
│ 1  │ shitfucks-bot     │ online  │ 0%      │ 120mb    │ ← Now runs both
└────┴───────────────────┴─────────┴─────────┴──────────┘
```

---

## Rollback (if needed):
If something goes wrong:
```bash
ssh vps
cd /var/www/discord-bot
git checkout HEAD~1
npm install
pm2 restart all
```

---

## Why This Fix Works:

**Before:**
- Bot process: Had Discord cache in memory ✅
- API process: Empty cache ❌
- They couldn't communicate (separate processes)

**After:**
- Single process runs both bot + API ✅
- Shared memory space ✅
- Cache accessible to both ✅

---

## Testing Checklist:

- [ ] Push to GitHub triggers webhook
- [ ] Auto-deploy completes successfully
- [ ] Old API process deleted
- [ ] Bot process restarted
- [ ] `pm2 status` shows only 1 process
- [ ] API responds with member data
- [ ] React app shows online members
- [ ] Bot Config page displays stats

---

Done! 🚀
