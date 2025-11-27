// Preload environment variables from .env.local or .env before the app starts.
// This module is intended to be passed to `node -r` so it runs before any other module.
const fs = require('fs');
const path = require('path');
try {
  const dotenv = require('dotenv');
  // Respect explicit DOTENV_CONFIG_PATH env var if provided
  const explicit = process.env.DOTENV_CONFIG_PATH;
  if (explicit) {
    dotenv.config({ path: explicit });
    // small log to aid debugging in CI/dev
    try { console.log('[preloadEnv] loaded DOTENV_CONFIG_PATH=', explicit); } catch (e) {}
  } else {
    // Only try to load local files when DATABASE_URL is not already present
    if (!process.env.DATABASE_URL) {
      const tryFiles = ['.env.local', '.env'];
      for (const f of tryFiles) {
        const p = fs.existsSync(f) ? f : (fs.existsSync(path.resolve(process.cwd(), f)) ? path.resolve(process.cwd(), f) : null);
        if (p) {
          dotenv.config({ path: p });
          try { console.log('[preloadEnv] loadedFrom=', p); } catch (e) {}
          break;
        }
      }
    } else {
      try { console.log('[preloadEnv] DATABASE_URL already present in environment'); } catch (e) {}
    }
  }
} catch (e) {
  // ignore - dotenv may not be installed in some environments
}
