# Profile Page Debug Guide

You're seeing raw JSON on the profile page instead of the rendered UI. Here's how to debug and fix it:

## Step 1: Clear Browser Cache & Storage

1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Storage** → **Clear site data** button
4. **Check all boxes** and click **Clear site data**
5. Close the browser completely
6. Reopen and try again

## Step 2: Check What You're Seeing

The raw JSON you showed contains:
```json
{
  "username": "0x501ff4fe11806e244d4ef1fa4b2192cbaa1a7441",
  "password": "95cb6e2d1e9eb1ceee1e6309",  // ⚠️ This should NOT be visible
  "address": "0x501ff4fe11806e244d4ef1fa4b2192cbaa1a7441",
  "id": "31d4b57f-f1d7-41db-bacd-1d04d3b93a65",
  "displayName": "shi",
  "avatar": "data:image/jpeg;base64,..."
}
```

**Where are you seeing this?**

A. **In the browser window** (the actual page content)
   → This means React is NOT rendering
   
B. **In DevTools Console** only
   → This is just logging, check the actual page
   
C. **In React DevTools** (Components tab)
   → This is just showing state, check the actual page

D. **In the Network tab** (response preview)
   → This is just the API response, check the actual page

## Step 3: Check Network Tab

1. Open DevTools (F12)
2. Go to **Network** tab
3. Reload the page
4. Find the request to `/api/me`
5. Check the response:
   - Does it return JSON with `{user, profile, hasProfile}`?
   - Or does it return plain JSON?

## Step 4: Check Console for Errors

1. Open DevTools (F12)
2. Go to **Console** tab
3. Look for errors starting with:
   - `[Profile]` - Profile component errors
   - `[AuthProvider]` - Auth context errors
4. Look for the new debug messages:
   - `[AuthProvider] Received data from /api/me:` - Shows what data we got
   - `[AuthProvider] Setting valid user data` - Confirms data was accepted
   - `[Profile] Invalid user data type:` - Shows if data is rejected

## Step 5: Check View Source

1. Right-click on the page → **View Page Source** (or Ctrl+U)
2. Look at the HTML:
   - Does it show `<div id="root"></div>` with JavaScript?
   - Or does it show raw JSON?

**If View Source shows JSON:**
→ The server is sending JSON instead of HTML
→ Check your server routes

**If View Source shows HTML but page shows JSON:**
→ React is crashing during render
→ Check Console for errors

## Step 6: Test with Fresh Session

```bash
# PowerShell - Clear all session data
Remove-Item -Path "$env:APPDATA\Local\Temp\*" -Force -Recurse -ErrorAction SilentlyContinue
```

Then:
1. Close ALL browser windows
2. Clear DNS cache: `ipconfig /flushdns`
3. Restart browser
4. Go to the site in **Incognito/Private** mode
5. Try logging in fresh

## Step 7: Check React is Running

Open Console and run:
```javascript
// Check if React rendered
console.log('Root element:', document.getElementById('root'));
console.log('Root innerHTML:', document.getElementById('root')?.innerHTML);

// Check if React is working
console.log('React version:', window.React?.version);
```

## Expected Console Output

After the fixes, you should see:
```
[AuthProvider] Received data from /api/me: {
  hasUser: true,
  hasProfile: true,
  userDataType: "object",
  isArray: false,
  isNull: false,
  keys: ["id", "username", "address", "displayName", "avatar", "level", "xp", ...]
}
[AuthProvider] Setting valid user data
```

## If JSON Still Shows

Try these in order:

1. **Hard Refresh:** Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

2. **Disable Extensions:**
   - Open browser in Safe Mode / Incognito
   - Disable all extensions temporarily

3. **Check Server Logs:**
   - Make sure server is running: `npm run dev`
   - Check terminal for errors

4. **Rebuild Client:**
   ```powershell
   cd client
   Remove-Item -Path node_modules/.vite -Recurse -Force
   npm run dev
   ```

5. **Nuclear Option:**
   ```powershell
   # Stop server
   # Then:
   Remove-Item -Path node_modules -Recurse -Force
   npm install
   npm run dev
   ```

## What Changed

I've added:

1. **Better validation** in Profile.tsx - checks if user is valid object
2. **Try-catch wrapper** around Profile render - catches any render errors
3. **Debug logging** in auth.tsx - shows exactly what data is received
4. **Clear cache button** - if error shows, you can clear cache directly
5. **Null checks** - prevents null or array from being treated as valid user

## Password Security Issue

⚠️ **IMPORTANT:** I noticed your JSON shows a `password` field. This should NEVER be sent to the client. 

Check `server/routes.ts` around line 473-530 (the `/api/me` endpoint) and make sure it's NOT including the password in the response.

The password should be removed before sending:
```typescript
const { password, ...userWithoutPassword } = user;
return { user: userWithoutPassword, profile, hasProfile };
```

## Next Steps

1. ✅ Clear browser cache (Step 1)
2. ✅ Check Console tab (Step 4)
3. ✅ Try Incognito mode (Step 6)
4. ✅ Report back what you see

Let me know:
- Where exactly you see the JSON (browser window, DevTools, etc.)
- What the Console shows
- Whether View Source shows HTML or JSON
