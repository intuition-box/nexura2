# Fixing "Bad Gateway" on Render

## What Was Fixed

1. **✅ Build Script** - Added `cross-env` to ensure NODE_ENV is set correctly during build
2. **✅ Start Script** - Fixed environment variable setting for production
3. **✅ Health Check Endpoint** - Added `/health` endpoint for monitoring
4. **✅ Better Logging** - Added startup logs showing port and environment
5. **✅ Error Handling** - Added try-catch to prevent silent failures
6. **✅ Render Configuration** - Created `render.yaml` with correct settings

## Render Deployment Checklist

### 1. Environment Variables (CRITICAL)

Go to your Render dashboard → Your service → Environment tab and add:

```
NODE_ENV=production
PORT=10000
SESSION_COOKIE_NAME=nexura_sid
TWITTER_API_KEY=QsYqhLu6WicLv2ELR25Joe7Zi
TWITTER_API_SECRET=UKML65AIYQkWaWJ46d0dBAmWI90BudkdjIkG3CROp5vTd0LMyj
TWITTER_CALLBACK_URL=https://YOUR_RENDER_URL.onrender.com/auth/x/callback
DATABASE_URL=<your_neon_database_url_if_using>
```

**⚠️ IMPORTANT:** Update `TWITTER_CALLBACK_URL` with your actual Render URL

### 2. Build & Start Commands

In Render dashboard → Your service → Settings:

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm start
```

### 3. Check Render Logs

1. Go to Render dashboard → Your service → Logs
2. Look for these startup messages:
   ```
   🚀 Server running in production mode
   🌐 Listening on 0.0.0.0:10000
   📊 Health check: http://localhost:10000/health
   ```

3. If you see errors like:
   - `EADDRINUSE` - Port already in use (restart the service)
   - `MODULE_NOT_FOUND` - Build failed (check build logs)
   - `Cannot find module` - Missing dependency (check package.json)

### 4. Test Health Endpoint

After deployment, test:
```bash
curl https://YOUR_RENDER_URL.onrender.com/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-11-19T...",
  "env": "production",
  "port": "10000"
}
```

### 5. Common "Bad Gateway" Causes

#### A. Build Failed
- Check Render build logs for errors
- Make sure all dependencies are in `package.json`
- Verify build command completes successfully

#### B. Server Not Starting
- Check for uncaught errors in startup code
- Verify environment variables are set
- Check if port binding failed

#### C. Port Issues
- Render automatically sets PORT to 10000
- Server MUST listen on `0.0.0.0` not `localhost`
- Don't hardcode port numbers

#### D. Missing Dependencies
```bash
# In Render logs, look for:
Error: Cannot find module 'express'
Error: Cannot find module './vite'
```

If you see these, your build didn't complete properly.

#### E. Timeout Issues
- Server is taking too long to start (>30 seconds)
- Add health check to verify server is responsive
- Check for blocking operations in startup code

### 6. Debug Steps

#### Step 1: Check Build Logs
1. Render dashboard → Your service → Logs
2. Filter by "Build"
3. Look for errors during `npm install` or `npm run build`

**Common errors:**
- `ERR! peer dependency` - Usually safe to ignore
- `ERR! code ELIFECYCLE` - Build script failed
- `Error: Command failed` - Build command syntax error

#### Step 2: Check Runtime Logs
1. Filter by "Runtime" or "Deploy"
2. Look for the startup messages:
   ```
   🚀 Server running in production mode
   🌐 Listening on 0.0.0.0:10000
   ```

3. If you don't see these, the server crashed during startup

#### Step 3: Test Locally in Production Mode
```powershell
# Set environment
$env:NODE_ENV="production"
$env:PORT="10000"

# Build
npm run build

# Start
npm start
```

If it works locally but not on Render, the issue is environment-specific.

### 7. Render-Specific Issues

#### Free Tier Limitations
- Service spins down after 15 minutes of inactivity
- First request after spin-down takes ~30-60 seconds
- May appear as "Bad Gateway" during startup

**Solution:** Use a paid plan or accept the cold start delay

#### Memory Limits
- Free tier: 512 MB RAM
- If your app uses more, it will be killed

**Check memory usage:**
```typescript
// Add to your health endpoint
console.log('Memory usage:', process.memoryUsage());
```

#### Disk Space
- Build artifacts must fit in available disk space
- Check `dist/` folder size after build

### 8. Static Files Not Serving

If the app starts but shows blank page:

**Check vite.ts:**
```typescript
// In production, serve static files from dist/public
export function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), "dist/public");
  console.log('Serving static files from:', distPath);
  app.use(express.static(distPath));
}
```

**Verify build output:**
```powershell
# Check if client files were built
ls dist/public
```

Should contain:
- `index.html`
- `assets/` folder with JS and CSS

### 9. Database Issues

If using Neon/PostgreSQL:

**Check DATABASE_URL:**
- Must start with `postgresql://` or `postgres://`
- Must be set in Render environment variables
- Connection pooling may be required for free tier

**Test connection:**
```typescript
// Add to startup
if (process.env.DATABASE_URL) {
  console.log('Database configured:', 
    process.env.DATABASE_URL.substring(0, 20) + '...');
}
```

### 10. Quick Fixes

#### Force Rebuild
1. Render dashboard → Your service
2. Manual Deploy → Clear build cache & deploy

#### Restart Service
1. Render dashboard → Your service
2. Manual Deploy → Deploy latest commit

#### Check Service Status
1. Render dashboard → Your service
2. Look at status badge: "Live" vs "Build failed" vs "Deploying"

### 11. Twitter OAuth Callback

**CRITICAL:** Update Twitter Developer Portal:

1. Go to https://developer.x.com/
2. Your project → App settings → Authentication settings
3. Add callback URL:
   ```
   https://YOUR_RENDER_URL.onrender.com/auth/x/callback
   ```

4. Also add to environment variables in Render

### 12. Monitor Logs in Real-Time

```bash
# Install Render CLI (optional)
npm install -g @render/cli

# Tail logs
render logs -f your-service-name
```

Or use the web dashboard: Dashboard → Service → Logs → Auto-scroll on

## Testing Checklist

After deployment:

- [ ] Health check responds: `curl https://YOUR_URL.onrender.com/health`
- [ ] Root endpoint responds: `curl https://YOUR_URL.onrender.com/`
- [ ] Static files load: Open URL in browser, check Network tab
- [ ] API endpoints work: Test `/api/me` with authentication
- [ ] Twitter OAuth works: Try logging in
- [ ] No errors in Render logs

## Still Getting Bad Gateway?

1. **Share Render logs** - Copy the last 50 lines from Render dashboard
2. **Share build output** - Copy build logs showing any errors
3. **Check service status** - Is it showing "Live" or "Build failed"?
4. **Try health check** - Does `/health` endpoint respond?
5. **Verify environment variables** - Are all required vars set?

## Common Log Messages

**✅ Good:**
```
🚀 Server running in production mode
🌐 Listening on 0.0.0.0:10000
📊 Health check: http://localhost:10000/health
```

**❌ Bad:**
```
Error: Cannot find module
Error: listen EADDRINUSE
UnhandledPromiseRejectionWarning
Error: connect ECONNREFUSED
```

## Next Steps

1. ✅ Push changes to Git
2. ✅ Redeploy on Render (should auto-deploy on push)
3. ✅ Check logs for startup messages
4. ✅ Test health endpoint
5. ✅ Update Twitter callback URL
6. ✅ Test login flow

If you're still seeing "Bad Gateway" after following this guide, share:
- The exact error from Render logs
- Build log output
- Service status (Live/Failed/Deploying)
