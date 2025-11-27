import serverless from 'serverless-http';
import * as http from 'http';

// Attempt to import the existing Express app from the server folder.
// The server's TypeScript sources are expected to be compiled by Vercel or the project's build step.
// This wrapper tries common export shapes and falls back to treating the imported value as an Express app.

// NOTE: You must install `serverless-http` in your project: `npm install --save serverless-http`

async function loadApp() {
  // Dynamically import so that any ESM/CJS interop is handled by the bundler/runtime.
  const mod: any = await import('../server/index');

  // Common export patterns:
  // - export const app = express();
  // - export default app;
  // - module.exports = app;
  // - export function createApp() { return app }

  let app: any;
  if (mod.default && (mod.default.handle || mod.default.set)) app = mod.default; // default export is app
  else if (mod.app && (mod.app.handle || mod.app.set)) app = mod.app; // named export 'app'
  else if (typeof mod.createApp === 'function') {
    app = await mod.createApp();
  } else if (mod.handler && typeof mod.handler === 'function') {
    // If the module already exported a serverless handler, use it directly
    return mod.handler;
  } else {
    // Last resort: try the module itself
    app = mod as any;
  }

  if (!app || !(app.handle || app.set)) {
    throw new Error('Could not locate an Express app export in ../server/index. Expected `app`, `default`, or `createApp()` export.');
  }

  return app;
}

let cachedHandler: any = null;

export default async function handler(req: any, res: any) {
  try {
    if (!cachedHandler) {
      const app = await loadApp();
      // serverless-http returns a function (req, res) => Promise
      cachedHandler = serverless(app);
    }

    // Call the serverless handler. serverless-http returns a function that expects (req, res)
    return cachedHandler(req, res);
  } catch (err) {
    console.error('Error initializing serverless app:', err);
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: String(err) }));
    return;
  }
}
