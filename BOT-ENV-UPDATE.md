# Discord Bot Environment Update for React Integration

## Changes Needed to VPS .env File

To allow the React frontend to connect to the Discord bot API, you need to update the `ALLOWED_ORIGINS` setting in the bot's `.env` file on your VPS.

### Current Line (Example):
```bash
ALLOWED_ORIGINS=http://localhost:3000
```

### Update To:
```bash
ALLOWED_ORIGINS=http://localhost:3000,http://82.197.92.33:3000
```

### If you're deploying the React app to a domain, also add that:
```bash
ALLOWED_ORIGINS=http://localhost:3000,http://82.197.92.33:3000,https://yourdomain.com
```

## Steps to Update on VPS:

1. **SSH into your VPS:**
   ```bash
   ssh vps
   ```

2. **Navigate to bot directory:**
   ```bash
   cd /var/www/discord-bot
   ```

3. **Edit the .env file:**
   ```bash
   nano .env
   ```

4. **Update the ALLOWED_ORIGINS line** (see examples above)

5. **Save and exit** (Ctrl+X, then Y, then Enter)

6. **Restart the bot:**
   ```bash
   pm2 restart shitfucks-api
   ```

7. **Verify the change:**
   ```bash
   pm2 logs shitfucks-api --lines 20
   ```

   You should see a line like:
   ```
   Allowed origins: http://localhost:3000, http://82.197.92.33:3000
   ```

## Alternative: Auto-Deploy via GitHub

If you prefer to use the auto-deploy feature:

1. Update the `.env.example` file locally (already done ✅)
2. Create/update your actual `.env` file on VPS with the correct values
3. The auto-deploy script will restart the services automatically when you push changes

## Notes:

- The bot's API runs on port **3001** by default
- Make sure your firewall allows incoming connections on port 3001:
  ```bash
  sudo ufw allow 3001/tcp
  sudo ufw status
  ```

- If using nginx as a reverse proxy, you don't need to open port 3001 publicly

## Testing the Connection:

From your local machine, test the API:

```bash
curl http://82.197.92.33:3001/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-...",
  "uptime": 12345,
  "cache": {
    "members": 10,
    "voiceStates": 2
  }
}
```

If you get a CORS error in the browser console, double-check the ALLOWED_ORIGINS setting.
