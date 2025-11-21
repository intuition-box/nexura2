import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertReferralEventSchema, insertReferralClaimSchema } from "@shared/schema";
import crypto from "crypto";
import { verifyMessage } from "ethers";
import fs from "fs";
import path from "path";

// In-memory stores for challenges and legacy bearer sessions. For production
// we prefer server-side sessions (express-session) backed by Postgres.
const challenges = new Map<string, { message: string; expiresAt: number; used?: boolean }>();// legacy
const sessions = new Map<string, { address: string; createdAt: number }>();

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for monitoring and load balancers
  app.get("/health", (req, res) => {
    res.status(200).json({ 
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Referral system routes
  app.get("/api/referrals/stats/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const stats = await storage.getReferralStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching referral stats:", error);
      res.status(500).json({ error: "Failed to fetch referral stats" });
    }
  });

  app.post("/api/referrals/event", async (req, res) => {
    try {
      const validatedData = insertReferralEventSchema.parse(req.body);
      const event = await storage.createReferralEvent(validatedData);
      res.json(event);
    } catch (error) {
      console.error("Error creating referral event:", error);
      res.status(400).json({ error: "Invalid referral event data" });
    }
  });

  // Claim referral rewards (disabled - to be implemented later)
  app.post("/api/referrals/claim/:userId", async (req, res) => {
    try {
      return res.status(503).json({ error: "Reward claiming not yet available" });
    } catch (error) {
      console.error("Error claiming referral rewards:", error);
      res.status(500).json({ error: "Failed to claim rewards" });
    }
  });

  // Dev-only helper: inspect persisted user profiles file. Disabled in production.
  app.get('/__dev/user_profiles', async (req, res) => {
    try {
      if (process.env.NODE_ENV === 'production') return res.status(404).json({ error: 'not available' });
      const pn = require('path').resolve(process.cwd(), 'server', 'data', 'user_profiles.json');
      const fs = require('fs');
      if (!fs.existsSync(pn)) return res.json({});
      const raw = fs.readFileSync(pn, 'utf8');
      const parsed = JSON.parse(raw || '{}');
      return res.json(parsed);
    } catch (e) {
      console.error('__dev/user_profiles error', e);
      return res.status(500).json({ error: 'failed' });
    }
  });

  // Wallet auth: issue a challenge message for an address
  app.get("/challenge", async (req, res) => {
    try {
      const address = String(req.query.address || "").trim();
      if (!address) return res.status(400).json({ error: "address required" });
      const nonce = crypto.randomBytes(12).toString("hex");
      const message = `Nexura Wallet Login\nAddress: ${address}\nNonce: ${nonce}`;
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
      challenges.set(address.toLowerCase(), { message, expiresAt });
      return res.json({ message });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "failed to create challenge" });
    }
  });

  app.post("/challenge", async (req, res) => {
    try {
      const { address } = req.body || {};
      if (!address) return res.status(400).json({ error: "address required" });
      const addr = String(address).trim().toLowerCase();
      const nonce = crypto.randomBytes(12).toString("hex");
      const message = `Nexura Wallet Login\nAddress: ${addr}\nNonce: ${nonce}`;
      const expiresAt = Date.now() + 5 * 60 * 1000;
      challenges.set(addr, { message, expiresAt });
      return res.json({ message });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "failed to create challenge" });
    }
  });

  // Verify signature and create a simple session token (returned to client)
  app.post("/auth/wallet", async (req, res) => {
    try {
      const { address, signature, message } = req.body || {};
      if (!address || !signature || !message) return res.status(400).json({ error: "address, signature and message required" });
      const stored = challenges.get(String(address).toLowerCase());
      // Allow either stored challenge or provided message (but prefer stored)
      if (stored) {
        if (stored.used) return res.status(400).json({ error: "challenge already used" });
        if (stored.expiresAt < Date.now()) return res.status(400).json({ error: "challenge expired" });
        if (stored.message !== message) return res.status(400).json({ error: "message mismatch" });
      }

      const recovered = verifyMessage(String(message), String(signature));
      if (recovered.toLowerCase() !== String(address).toLowerCase()) {
        return res.status(401).json({ error: "signature verification failed" });
      }

      // mark challenge used
      if (stored) stored.used = true;


      // Establish a server-side session for this authenticated user. We save the
      // wallet address onto the session so subsequent requests can use cookie
      // based authentication. This is the production-friendly behavior for
      // deployments (e.g., Render). We still retain the legacy sessions map
      // for bearer-token compatibility where necessary.
      try {
        (req as any).session.address = String(address).toLowerCase();
        (req as any).session.createdAt = Date.now();
      } catch (e) {
        console.warn('failed to set cookie session', e);
      }

      // For backward compatibility with any clients expecting a bearer token,
      // also create a short-lived legacy bearer token and return it in the
      // response. This gives clients time to migrate to cookie-based sessions.
      const token = crypto.randomBytes(32).toString("hex");
      sessions.set(token, { address: String(address).toLowerCase(), createdAt: Date.now() });

      // Ensure a user record exists for this address so /profile can return user data.
      try {
        const addrLower = String(address).toLowerCase();
        const existing = await storage.getUserByAddress(addrLower);
        if (!existing) {
          // create a lightweight user record keyed by address
          const randPwd = crypto.randomBytes(12).toString("hex");
          // We include an `address` field so MemStorage and other storage impls can look it up
          await storage.createUser({ username: addrLower, password: randPwd, address: addrLower } as any);
        }
      } catch (e) {
        console.warn("failed to ensure user record for address", e);
      }

      return res.json({ accessToken: token });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "verification failed" });
    }
  });

  // Dev-only login helper removed for production readiness. If you need a
  // developer-only shortcut, create it locally but do NOT deploy it to
  // production. This endpoint was intentionally removed.

  // Removed permissive /auth/open endpoint for production. Use the wallet
  // signature flow (/challenge + /auth/wallet) for secure logins.

  // --- Twitter (X) OAuth1.0a integration (request token -> authorize -> access token)
  const requestTokenSecrets = new Map<string, { secret: string; sessionToken?: string }>();

  // parseCookies removed: authentication uses Authorization: Bearer <token> only

  // helper to require an authenticated session token
  // Only accepts Authorization: Bearer <token>.
  function getSessionFromReq(req: any) {
    try {
      console.log(`🔍 Auth check for ${req.method} ${req.path}`);

      // Primary: server-side cookie session (express-session)
      try {
        if (req.session && req.session.address) {
          const token = req.sessionID || null;
          const sessionObj = { address: String(req.session.address).toLowerCase(), createdAt: req.session.createdAt || Date.now() };
          console.log(`✅ Auth via server-side session for ${String(sessionObj.address).substring(0,10)}...`);
          return { token, session: sessionObj };
        }
      } catch (e) {
        console.warn('session check failed', e);
      }

      // Fallback: legacy Bearer token support
      const auth = String(req.headers.authorization || "").trim();
      if (!auth || !auth.toLowerCase().startsWith('bearer ')) {
        console.log('❌ No Bearer authorization header present');
        return null;
      }
      const token = auth.split(/\s+/)[1];
      if (!token) {
        console.log('❌ Malformed Bearer token');
        return null;
      }
      const s = sessions.get(token);
      if (!s) {
        console.log('❌ Bearer token not found in sessions');
        return null;
      }
      console.log(`✅ Auth via Bearer token for ${s.address.substring(0, 10)}...`);
      return { token, session: s };
    } catch (e) {
      console.log('❌ Auth error:', e);
      return null;
    }
  }

  // Step 1: obtain request token and redirect user to X authorize
  app.get('/auth/x/login', async (req, res) => {
    try {
      const sess = getSessionFromReq(req);
      if (!sess || !sess.session) return res.status(401).send('sign in required');

      const TWITTER_KEY = process.env.TWITTER_API_KEY;
      const TWITTER_SECRET = process.env.TWITTER_API_SECRET;
      const CALLBACK = process.env.TWITTER_CALLBACK_URL || `${req.protocol}://${req.get('host')}/auth/x/callback`;
      if (!TWITTER_KEY || !TWITTER_SECRET) return res.status(500).json({ error: 'twitter keys not configured' });

      // build OAuth1 header for request_token
      const oauth = require('crypto');
      // We'll use a minimal OAuth1 signature via oauth-1.0a style headers using simple library if available
      const oauth1 = require('oauth-1.0a');
      const client = oauth1({ consumer: { key: TWITTER_KEY, secret: TWITTER_SECRET }, signature_method: 'HMAC-SHA1', hash_function(base_string: string, key: string) { return require('crypto').createHmac('sha1', key).update(base_string).digest('base64'); } });
      const request_data = { url: 'https://api.twitter.com/oauth/request_token', method: 'POST', data: { oauth_callback: CALLBACK } };
      const headers = client.toHeader(client.authorize(request_data));

      const r = await fetch(request_data.url, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' } });
      const txt = await r.text();
      if (!r.ok) {
        console.error('request_token failed', txt);
        return res.status(500).json({ error: 'request_token_failed', details: txt });
      }
      const params = new URLSearchParams(txt);
      const oauth_token = params.get('oauth_token');
      const oauth_token_secret = params.get('oauth_token_secret');
      if (!oauth_token || !oauth_token_secret) return res.status(500).json({ error: 'invalid_request_token' });

      requestTokenSecrets.set(oauth_token, { secret: oauth_token_secret, sessionToken: sess.token });

      // redirect to authorize URL
      return res.redirect(`https://api.twitter.com/oauth/authorize?oauth_token=${oauth_token}`);
    } catch (e) {
      console.error('auth/x/login error', e);
      return res.status(500).json({ error: 'failed' });
    }
  });

  // Step 2: callback from Twitter
  app.get('/auth/x/callback', async (req, res) => {
    try {
      const { oauth_token, oauth_verifier } = req.query as any;
      if (!oauth_token || !oauth_verifier) return res.status(400).send('missing');
      const stored = requestTokenSecrets.get(String(oauth_token));
      if (!stored) return res.status(400).send('unknown request token');

      const TWITTER_KEY = process.env.TWITTER_API_KEY;
      const TWITTER_SECRET = process.env.TWITTER_API_SECRET;
      if (!TWITTER_KEY || !TWITTER_SECRET) return res.status(500).json({ error: 'twitter keys not configured' });

      const oauth1 = require('oauth-1.0a');
      const client = oauth1({ consumer: { key: TWITTER_KEY, secret: TWITTER_SECRET }, signature_method: 'HMAC-SHA1', hash_function(base_string: string, key: string) { return require('crypto').createHmac('sha1', key).update(base_string).digest('base64'); } });

      const request_data = { url: 'https://api.twitter.com/oauth/access_token', method: 'POST', data: { oauth_verifier } };
      const token = { key: oauth_token as string, secret: stored.secret };
      const headers = client.toHeader(client.authorize(request_data, token));
      const r = await fetch(request_data.url, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ oauth_verifier }) });
      const txt = await r.text();
      if (!r.ok) {
        console.error('access_token failed', txt);
        return res.status(500).json({ error: 'access_token_failed', details: txt });
      }
      const params = new URLSearchParams(txt);
      const access_token = params.get('oauth_token');
      const access_token_secret = params.get('oauth_token_secret');
      const user_id = params.get('user_id');
      const screen_name = params.get('screen_name');
      if (!access_token || !access_token_secret) return res.status(500).json({ error: 'invalid_access_token' });

      // find session token and associated app user
      const sessionToken = stored.sessionToken;
      const s = sessions.get(sessionToken || '');
      if (!s) {
        // no session: still store tokens under the address as a fallback
        const addr = (s && (s as any).address) || null;
        if (!addr) {
          // cannot associate - return to quests with notice
          return res.redirect('/quests');
        }
      }

      // look up user by address
      const user = await storage.getUserByAddress((s as any).address);
      const userId = user ? user.id : null;
      if (!userId) {
        // create a lightweight user for this address if needed
        // attempt to create or skip
      }

      if (userId) {
        await storage.upsertUserOAuth(userId, 'twitter', { oauth_token: access_token, oauth_token_secret: access_token_secret, user_id, screen_name });
      }

      // cleanup request token secret
      requestTokenSecrets.delete(String(oauth_token));

      // redirect the user back to the app quests page
      return res.redirect('/quests');
    } catch (e) {
      console.error('auth/x/callback error', e);
      return res.status(500).json({ error: 'failed' });
    }
  });

  // Verification endpoints for quests (follow/like/retweet)
  app.post('/quests/verify/follow', async (req, res) => {
    try {
      const sess = getSessionFromReq(req);
      if (!sess || !sess.session) return res.status(401).json({ error: 'not authenticated' });
      const user = await storage.getUserByAddress(sess.session.address);
      if (!user) return res.status(400).json({ error: 'no user' });
      const token = await storage.getOAuthToken(user.id, 'twitter');
      if (!token) return res.status(403).json({ error: 'no-twitter-token' });

      const target = String((req.body && req.body.target) || req.query.target || '');
      if (!target) return res.status(400).json({ error: 'target required' });

      // call friendships/show (v1.1) to check relationship
      const TWITTER_KEY = process.env.TWITTER_API_KEY;
      const TWITTER_SECRET = process.env.TWITTER_API_SECRET;
      const oauth1 = require('oauth-1.0a');
      const client = oauth1({ consumer: { key: TWITTER_KEY, secret: TWITTER_SECRET }, signature_method: 'HMAC-SHA1', hash_function(base_string: string, key: string) { return require('crypto').createHmac('sha1', key).update(base_string).digest('base64'); } });
      const userToken = { key: token.access_token || token.oauth_token, secret: token.refresh_token || token.oauth_token_secret || token.access_token_secret };
      const url = `https://api.twitter.com/1.1/friendships/show.json?source_screen_name=${encodeURIComponent(token.screen_name || '')}&target_screen_name=${encodeURIComponent(target)}`;
      const request_data = { url, method: 'GET' };
      const headers = client.toHeader(client.authorize(request_data, userToken));
      const r = await fetch(url, { method: 'GET', headers: { ...headers, Accept: 'application/json' } });
      const j = await r.json().catch(() => null);
      if (!r.ok) return res.status(500).json({ error: 'api_failed', details: j });
      const follows = j && j.relationship && j.relationship.source && j.relationship.source.following;
      if (follows) {
        return res.json({ ok: true });
      }
      return res.json({ ok: false });
    } catch (e) {
      console.error('/quests/verify/follow error', e);
      return res.status(500).json({ error: 'failed' });
    }
  });

  // Stub endpoints for like and retweet verification (can be expanded)
  app.post('/quests/verify/like', async (req, res) => {
    try {
      const sess = getSessionFromReq(req);
      if (!sess || !sess.session) return res.status(401).json({ error: 'not authenticated' });
      const user = await storage.getUserByAddress(sess.session.address);
      if (!user) return res.status(400).json({ error: 'no user' });
      const token = await storage.getOAuthToken(user.id, 'twitter');
      if (!token) return res.status(403).json({ error: 'no-twitter-token' });

      const tweetId = String((req.body && req.body.tweetId) || req.query.tweetId || '');
      if (!tweetId) return res.status(400).json({ error: 'tweetId required' });

      const TWITTER_KEY = process.env.TWITTER_API_KEY;
      const TWITTER_SECRET = process.env.TWITTER_API_SECRET;
      const oauth1 = require('oauth-1.0a');
      const client = oauth1({ consumer: { key: TWITTER_KEY, secret: TWITTER_SECRET }, signature_method: 'HMAC-SHA1', hash_function(base_string: string, key: string) { return require('crypto').createHmac('sha1', key).update(base_string).digest('base64'); } });
      const userToken = { key: token.access_token || token.oauth_token, secret: token.refresh_token || token.oauth_token_secret || token.access_token_secret };
      const url = `https://api.twitter.com/1.1/statuses/show.json?id=${encodeURIComponent(tweetId)}&include_my_retweet=false`;
      const request_data = { url, method: 'GET' };
      const headers = client.toHeader(client.authorize(request_data, userToken));
      const r = await fetch(url, { method: 'GET', headers: { ...headers, Accept: 'application/json' } });
      const j = await r.json().catch(() => null);
      if (!r.ok) return res.status(500).json({ error: 'api_failed', details: j });
      const favorited = !!j && !!j.favorited;
      return res.json({ ok: !!favorited });
    } catch (e) {
      console.error('/quests/verify/like error', e);
      return res.status(500).json({ error: 'failed' });
    }
  });

  app.post('/quests/verify/retweet', async (req, res) => {
    try {
      const sess = getSessionFromReq(req);
      if (!sess || !sess.session) return res.status(401).json({ error: 'not authenticated' });
      const user = await storage.getUserByAddress(sess.session.address);
      if (!user) return res.status(400).json({ error: 'no user' });
      const token = await storage.getOAuthToken(user.id, 'twitter');
      if (!token) return res.status(403).json({ error: 'no-twitter-token' });

      const tweetId = String((req.body && req.body.tweetId) || req.query.tweetId || '');
      if (!tweetId) return res.status(400).json({ error: 'tweetId required' });

      const TWITTER_KEY = process.env.TWITTER_API_KEY;
      const TWITTER_SECRET = process.env.TWITTER_API_SECRET;
      const oauth1 = require('oauth-1.0a');
      const client = oauth1({ consumer: { key: TWITTER_KEY, secret: TWITTER_SECRET }, signature_method: 'HMAC-SHA1', hash_function(base_string: string, key: string) { return require('crypto').createHmac('sha1', key).update(base_string).digest('base64'); } });
      const userToken = { key: token.access_token || token.oauth_token, secret: token.refresh_token || token.oauth_token_secret || token.access_token_secret };
      // statuses/show returns `retweeted` boolean for the authenticating user
      const url = `https://api.twitter.com/1.1/statuses/show.json?id=${encodeURIComponent(tweetId)}&include_my_retweet=true`;
      const request_data = { url, method: 'GET' };
      const headers = client.toHeader(client.authorize(request_data, userToken));
      const r = await fetch(url, { method: 'GET', headers: { ...headers, Accept: 'application/json' } });
      const j = await r.json().catch(() => null);
      if (!r.ok) return res.status(500).json({ error: 'api_failed', details: j });
      const retweeted = !!j && !!j.retweeted;
      return res.json({ ok: !!retweeted });
    } catch (e) {
      console.error('/quests/verify/retweet error', e);
      return res.status(500).json({ error: 'failed' });
    }
  });

  // Logout: clear server-side session and instruct client to remove cookie
  app.post("/auth/logout", async (req, res) => {
    try {
      const sess = getSessionFromReq(req);
      // Destroy server-side cookie session if present
      try {
        if ((req as any).session) {
          (req as any).session.destroy?.(() => {});
        }
      } catch (e) {
        console.warn('failed to destroy server session', e);
      }

      // Remove legacy bearer token if present
      if (sess && sess.token && sessions.has(sess.token)) {
        sessions.delete(sess.token);
      }

      return res.json({ success: true });
    } catch (err) {
      console.error("logout failed", err);
      return res.status(500).json({ error: "logout failed" });
    }
  });

  // Return profile for authenticated session (bearer-based)
  app.get("/profile", async (req, res) => {
    try {
      const sess = getSessionFromReq(req);
      if (!sess) return res.status(401).json({ error: "not authenticated" });

      // Try to fetch user by address from storage
      const user = await storage.getUserByAddress(sess.session.address);
      if (!user) {
        // Authenticated but no user record yet; return empty object so client
        // can render defaults client-side.
        return res.json({ user: null, hasProfile: false });
      }

      // Get profile data
      const profile = await storage.getUserProfile(user.id);

      // Remove password field before sending
      const { password, ...safeUser } = user as any;
      
      return res.json({
        user: {
          ...safeUser,
          displayName: profile?.displayName || (user as any).displayName || user.username,
          level: profile?.level || 1,
          xp: profile?.xp || 0,
        },
        hasProfile: !!profile,
        profile: profile || null
      });
    } catch (err) {
      console.error("profile error", err);
      return res.status(500).json({ error: "failed to fetch profile" });
    }
  });

  // Return combined user + profile info for the authenticated session
  app.get("/api/me", async (req, res) => {
    try {
      const sess = getSessionFromReq(req);
      if (!sess) return res.status(401).json({ error: "not authenticated" });

      const user = await storage.getUserByAddress(sess.session.address);
      if (!user) return res.json({ user: null, hasProfile: false, hasProject: false });
      const profile = await storage.getUserProfile(user.id);

      // check for projects owned by this wallet address or by user id
      let projects = [] as any[];
      try {
        const all = await storage.listProjects();
        const lower = String(sess.session.address).toLowerCase();
        projects = all.filter((p: any) => {
          const ownerAddr = (p.ownerAddress || p.owner_address || "").toString().toLowerCase();
          const ownerUserId = p.ownerUserId || p.owner_user_id || p.ownerUserId || null;
          return (ownerAddr && ownerAddr === lower) || (ownerUserId && ownerUserId === user.id);
        });
      } catch (e) {
        // ignore project lookup errors
      }

      // Return user without password field
      const { password, ...safeUser } = user as any;
      return res.json({ 
        user: {
          ...safeUser,
          displayName: profile?.displayName || (user as any).displayName || user.username,
          display_name: profile?.displayName || (user as any).displayName || user.username,
          level: profile?.level || 1,
          xp: profile?.xp || 0,
          questsCompleted: profile?.questsCompleted || 0,
          quests_completed: profile?.questsCompleted || 0,
          tasksCompleted: profile?.tasksCompleted || 0,
          tasks_completed: profile?.tasksCompleted || 0,
          avatar: profile?.avatar || null,
        },
        hasProfile: !!profile,
        profile: profile || null,
        hasProject: projects.length > 0,
        projectId: projects.length > 0 ? projects[0].id : null
      });
    } catch (e) {
      console.error("/api/me error", e);
      return res.status(500).json({ error: "failed" });
    }
  });

  // Update user profile (display name, avatar, etc.)
  app.post("/api/upload/avatar", async (req, res) => {
    try {
      const sess = getSessionFromReq(req);
      // Log auth info for debugging upload failures (server session preferred)
      try {
        console.log('/api/upload/avatar headers:', { authorization: req.headers.authorization });
        if ((req as any).session && (req as any).session.address) {
          console.log('/api/upload/avatar server session address:', (req as any).session.address);
        } else {
          const authHeader = String(req.headers.authorization || '');
          const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.split(/\s+/)[1] : null;
          console.log('/api/upload/avatar bearer token present?', !!token, 'sessionsCount=', sessions.size);
          if (token && sessions.has(token)) {
            console.log('/api/upload/avatar session for token:', sessions.get(token));
          }
        }
      } catch (logErr) {
        console.warn('failed to log upload auth info', logErr);
      }

      if (!sess?.session) return res.status(401).json({ error: "not authenticated" });
      
      const { imageData, fileName } = req.body || {};
      if (!imageData || typeof imageData !== "string") {
        return res.status(400).json({ error: "imageData required as base64 or data URL" });
      }
      
      // Extract base64 data (remove data:image/...;base64, prefix if present)
      const base64Match = imageData.match(/^data:image\/[^;]+;base64,(.+)$/);
      const base64Data = base64Match ? base64Match[1] : imageData;
      
      // Generate unique filename
      const ext = fileName?.split('.').pop() || 'png';
      const uniqueName = `avatar-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'uploads', 'avatars');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Save file
      const filePath = path.join(uploadsDir, uniqueName);
      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
      
      // Return public URL
      const publicUrl = `/uploads/avatars/${uniqueName}`;
      
      return res.json({ success: true, url: publicUrl });
    } catch (e) {
      console.error("/api/upload/avatar error", e);
      return res.status(500).json({ error: "upload failed", detail: (e && (e as any).message) || String(e) });
    }
  });

  app.put("/api/users/profile", async (req, res) => {
    try {
      const sess = getSessionFromReq(req);
      if (!sess) return res.status(401).json({ error: "not authenticated" });

      const user = await storage.getUserByAddress(sess.session.address);
      if (!user) return res.status(404).json({ error: "user not found" });

      const { displayName, avatar, socialProfiles } = req.body || {};
      
      const currentProfile = await storage.getUserProfile(user.id);
      
      await storage.updateUserProfile(user.id, {
        displayName: displayName || user.username,
        avatar: avatar || currentProfile?.avatar || null,
        socialProfiles: socialProfiles || {}
      });

      const updatedUser = await storage.getUser(user.id);
      return res.json({ success: true, user: updatedUser });
    } catch (e) {
      console.error("/api/users/profile PUT error", e);
      return res.status(500).json({ error: "failed to update profile" });
    }
  });

  const httpServer = createServer(app);

  // initialize websocket notifications
  try {
    const { initWebsocketServer } = await import("./notifications");
    initWebsocketServer(httpServer as any);
  } catch (e) {
    console.warn("ws init failed", e);
  }

  // Start mint worker module (will be idle until jobs are enqueued)
  try {
    const { default: worker } = await import("./mintWorker");
    // no-op: module side-effects are sufficient
  } catch (e) {
    console.warn("mint worker failed to load", e);
  }

  // API: add XP to a user. Body: { userId, xp, questId (optional) }
  app.post("/api/xp/add", async (req, res) => {
    try {
      const { userId, xp, questId, questsCompletedDelta = 0, tasksCompletedDelta = 0 } = req.body || {};
      console.log(`/api/xp/add called with`, { userId, xp, questId, questsCompletedDelta, tasksCompletedDelta });
      
      if (!userId || typeof xp !== "number") {
        console.warn('/api/xp/add invalid payload', req.body);
        return res.status(400).json({ error: "userId and numeric xp required" });
      }
      
      // If questId is provided, check if already completed AND record it atomically
      if (questId) {
        const alreadyCompleted = await storage.isQuestCompleted(userId, questId);
        if (alreadyCompleted) {
          console.log(`[/api/xp/add] Quest ${questId} already completed by user ${userId}`);
          return res.status(409).json({ 
            error: "Quest already completed",
            message: "You have already claimed this quest."
          });
        }
        
        // Record completion BEFORE awarding XP to prevent race conditions
        // The database UNIQUE constraint will prevent duplicates even in concurrent requests
        try {
          await storage.recordQuestCompletion(userId, questId, xp);
          console.log(`[/api/xp/add] Recorded completion of quest ${questId} for user ${userId}`);
        } catch (e: any) {
          // If this fails due to duplicate key (concurrent request), return 409
          const isDuplicate = 
            e?.code === 'DUPLICATE_QUEST_COMPLETION' || // MemStorage
            e?.code === '23505' || // PostgreSQL unique violation
            e?.message?.includes('duplicate') || 
            e?.constraint?.includes('user_quest_completions');
          
          if (isDuplicate) {
            console.log(`[/api/xp/add] Duplicate quest completion detected for ${questId} by user ${userId}`);
            return res.status(409).json({ 
              error: "Quest already completed",
              message: "You have already claimed this quest."
            });
          }
          console.error(`[/api/xp/add] Failed to record quest completion:`, e);
          return res.status(500).json({ error: "Failed to record quest completion" });
        }
      }
      
      const result = await storage.addXpToUser(userId, xp, {
        questsCompletedInc: questsCompletedDelta,
        tasksCompletedInc: tasksCompletedDelta,
      });
      console.log(`/api/xp/add result for userId=${userId}:`, result);
      
      // if leveled up, create a mint record and enqueue job
      if (result.newLevel > result.previousLevel) {
        const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
        const level = result.newLevel;
        const user = await storage.getUser(userId);
        const address = (user as any)?.address || null;
        await storage.createOrGetLevelNftRecord({ userId, level, status: "queued", jobId });
        if (address) {
          const { enqueueMint } = await import("./mintWorker");
          enqueueMint({ jobId, userId, level, address });
        }
      }
      return res.json(result);
    } catch (err) {
      console.error("add xp error", err);
      return res.status(500).json({ error: "failed to add xp" });
    }
  });

  // Task management endpoints
  app.get("/api/tasks", async (req, res) => {
    try {
      const { type } = req.query;
      const tasks = await storage.getAllTasks(type as string);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/completed/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const completedTaskIds = await storage.getUserCompletedTasks(userId);
      res.json({ completedTasks: completedTaskIds });
    } catch (error) {
      console.error("Error fetching completed tasks:", error);
      res.status(500).json({ error: "Failed to fetch completed tasks" });
    }
  });

  app.post("/api/tasks/claim", async (req, res) => {
    try {
      const { userId, taskId } = req.body || {};
      console.log(`/api/tasks/claim called with`, { userId, taskId });
      
      if (!userId || !taskId) {
        return res.status(400).json({ error: "userId and taskId required" });
      }

      // Check if task exists
      const task = await storage.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Check if already completed
      const alreadyCompleted = await storage.isTaskCompleted(userId, taskId);
      if (alreadyCompleted) {
        console.log(`[/api/tasks/claim] Task ${taskId} already completed by user ${userId}`);
        return res.status(409).json({ 
          error: "Task already completed",
          message: "You have already claimed this task."
        });
      }

      // Record completion BEFORE awarding XP to prevent race conditions
      try {
        await storage.recordTaskCompletion(userId, taskId, task.xpReward);
        console.log(`[/api/tasks/claim] Recorded completion of task ${taskId} for user ${userId}`);
      } catch (e: any) {
        // If this fails due to duplicate (concurrent request), return 409
        const isDuplicate = 
          e?.code === 'DUPLICATE_TASK_COMPLETION' ||
          e?.code === '23505' ||
          e?.message?.includes('duplicate');
        
        if (isDuplicate) {
          console.log(`[/api/tasks/claim] Duplicate task completion detected for ${taskId} by user ${userId}`);
          return res.status(409).json({ 
            error: "Task already completed",
            message: "You have already claimed this task."
          });
        }
        console.error(`[/api/tasks/claim] Failed to record task completion:`, e);
        return res.status(500).json({ error: "Failed to record task completion" });
      }

      // Award XP with proper quest/task counters
      const result = await storage.addXpToUser(userId, task.xpReward, {
        questsCompletedInc: task.questIncrement || 0,
        tasksCompletedInc: task.taskIncrement || 0,
      });
      console.log(`/api/tasks/claim result for userId=${userId}:`, result);

      // Handle level-up NFT minting
      if (result.newLevel > result.previousLevel) {
        const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
        const level = result.newLevel;
        const user = await storage.getUser(userId);
        const address = (user as any)?.address || null;
        await storage.createOrGetLevelNftRecord({ userId, level, status: "queued", jobId });
        if (address) {
          const { enqueueMint } = await import("./mintWorker");
          enqueueMint({ jobId, userId, level, address });
        }
      }

      return res.json({ 
        success: true, 
        result,
        task: {
          id: task.id,
          title: task.title,
          xpReward: task.xpReward
        }
      });
    } catch (err) {
      console.error("task claim error", err);
      return res.status(500).json({ error: "failed to claim task" });
    }
  });

  // Request server to mint level badge for a user/level (idempotent)
  app.post("/api/tiers/mint", async (req, res) => {
    try {
      const { userId, level } = req.body || {};
      if (!userId || typeof level !== "number") return res.status(400).json({ error: "userId and level required" });
      const keyRecord = await storage.getLevelNftRecord(userId, level);
      if (keyRecord && keyRecord.txHash) return res.json({ status: "already_minted", record: keyRecord });
      const user = await storage.getUser(userId);
      const address = (user as any)?.address;
      if (!address) return res.status(400).json({ error: "user has no wallet address" });
      const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
      await storage.createOrGetLevelNftRecord({ userId, level, status: "queued", jobId });
      const { enqueueMint } = await import("./mintWorker");
      enqueueMint({ jobId, userId, level, address });
      return res.json({ status: "queued", jobId });
    } catch (err) {
      console.error("mint request failed", err);
      return res.status(500).json({ error: "failed to queue mint" });
    }
  });

  app.get("/api/tiers/mint/:userId/:level", async (req, res) => {
    try {
      const { userId, level } = req.params;
      const rec = await storage.getLevelNftRecord(userId, Number(level));
      if (!rec) return res.status(404).json({ error: "not found" });
      return res.json(rec);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "failed" });
    }
  });

  // Campaigns API
  app.get("/api/campaigns", async (req, res) => {
    try {
      const campaigns = await storage.getAllCampaigns();
      return res.json(campaigns);
    } catch (err) {
      console.error("get campaigns error", err);
      return res.status(500).json({ error: "failed to fetch campaigns" });
    }
  });

  app.get("/api/campaigns/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const campaign = await storage.getCampaignById(id);
      if (!campaign) {
        return res.status(404).json({ error: "campaign not found" });
      }
      return res.json(campaign);
    } catch (err) {
      console.error("get campaign error", err);
      return res.status(500).json({ error: "failed to fetch campaign" });
    }
  });

  // Leaderboard endpoint: fetch top users by XP with proper user data
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const limit = parseInt(String(req.query.limit || '100'), 10);
      
      if ((storage as any).pool) {
        const result = await (storage as any).query(`
          SELECT 
            u.id,
            u.username,
            u.address,
            p.display_name,
            COALESCE(p.xp, 0) as xp,
            COALESCE(p.level, 1) as level,
            COALESCE(p.quests_completed, 0) as quests_completed,
            COALESCE(p.tasks_completed, 0) as tasks_completed
          FROM users u
          LEFT JOIN user_profiles p ON u.id = p.user_id
          WHERE COALESCE(p.xp, 0) > 0
          ORDER BY COALESCE(p.xp, 0) DESC, COALESCE(p.level, 1) DESC
          LIMIT $1
        `, [limit]);
        return res.json(result.rows || []);
      }
      
      const users = [] as any[];
      const memStorage = storage as any;
      
      if (memStorage.userProfiles && memStorage.userProfiles.entries) {
        for (const [userId, profile] of memStorage.userProfiles.entries()) {
          if (!profile || (profile.xp || 0) <= 0) continue;
          
          const user = await storage.getUser(userId);
          if (user) {
            const displayName = profile.displayName || (user as any).displayName || user.username;
            users.push({
              id: user.id,
              username: user.username,
              address: (user as any).address || null,
              display_name: displayName,
              xp: profile.xp || 0,
              level: profile.level || 1,
              quests_completed: profile.questsCompleted || 0,
              tasks_completed: profile.tasksCompleted || 0,
            });
          }
        }
      }
      
      users.sort((a, b) => {
        const xpDiff = (b.xp || 0) - (a.xp || 0);
        if (xpDiff !== 0) return xpDiff;
        return (b.level || 1) - (a.level || 1);
      });
      return res.json(users.slice(0, limit));
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  // Projects API: create/list/get projects (simple in-memory persistence for dev)
  app.post("/projects", async (req, res) => {
    try {
      const body = req.body || {};
      // expect at least name and ownerAddress
      if (!body.name || !body.ownerAddress) return res.status(400).json({ error: "name and ownerAddress required" });
      const project = await storage.createProject(body);
      return res.status(201).json(project);
    } catch (err) {
      console.error("create project failed", err);
      return res.status(500).json({ error: "create project failed" });
    }
  });

  app.get("/projects", async (req, res) => {
    try {
      const list = await storage.listProjects();
      return res.json(list);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "failed to list projects" });
    }
  });

  app.get("/projects/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const p = await storage.getProjectById(id);
      if (!p) return res.status(404).json({ error: "not found" });
      return res.json(p);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "failed to fetch project" });
    }
  });

  // Campaign Tasks API
  app.post("/api/campaigns/:campaignId/tasks", async (req, res) => {
    try {
      const sess = getSessionFromReq(req);
      if (!sess?.session) return res.status(401).json({ error: "not authenticated" });
      
      const { campaignId } = req.params;
      const campaign = await storage.getCampaignById(campaignId);
      if (!campaign) return res.status(404).json({ error: "campaign not found" });
      
      // TODO: Validate project ownership/permissions
      
      const taskData = {
        ...req.body,
        campaignId,
        projectId: campaign.project_id,
      };
      
      const task = await storage.createCampaignTask(taskData);
      return res.status(201).json(task);
    } catch (err) {
      console.error("[POST /api/campaigns/:campaignId/tasks]", err);
      return res.status(500).json({ error: "failed to create task" });
    }
  });

  app.get("/api/campaigns/:campaignId/tasks", async (req, res) => {
    try {
      const { campaignId } = req.params;
      const tasks = await storage.getCampaignTasks(campaignId);
      return res.json(tasks);
    } catch (err) {
      console.error("[GET /api/campaigns/:campaignId/tasks]", err);
      return res.status(500).json({ error: "failed to fetch tasks" });
    }
  });

    // Quests API: list completed quests for a user
    app.get('/api/quests/completed/:userId', async (req, res) => {
      try {
        const { userId } = req.params;
        if (!userId) return res.status(400).json({ error: 'userId required' });
        const completed = await storage.getUserCompletedQuests(userId);
        return res.json({ completed });
      } catch (e) {
        console.error('[GET /api/quests/completed/:userId] error', e);
        return res.status(500).json({ error: 'failed to fetch completed quests' });
      }
    });

    // Quests API: claim a quest (wrapper over /api/xp/add) - ensures idempotency and returns updated profile
    app.post('/api/quests/claim', async (req, res) => {
      try {
        const { userId, questId, xp } = req.body || {};
        if (!userId || !questId || typeof xp !== 'number') return res.status(400).json({ error: 'userId, questId and numeric xp required' });

        // Check duplicate
        const already = await storage.isQuestCompleted(userId, questId);
        if (already) return res.status(409).json({ error: 'Quest already claimed' });

        // Record completion and award xp (atomic at application level for MemStorage)
        try {
          await storage.recordQuestCompletion(userId, questId, xp);
        } catch (e: any) {
          const isDuplicate = e?.code === 'DUPLICATE_QUEST_COMPLETION' || e?.code === '23505' || e?.message?.includes('duplicate');
          if (isDuplicate) return res.status(409).json({ error: 'Quest already claimed' });
          console.error('[POST /api/quests/claim] recordQuestCompletion failed', e);
          return res.status(500).json({ error: 'failed to record quest completion' });
        }

        const result = await storage.addXpToUser(userId, xp, { questsCompletedInc: 1 });

        return res.json({ success: true, result });
      } catch (e) {
        console.error('[POST /api/quests/claim] error', e);
        return res.status(500).json({ error: 'failed to claim quest' });
      }
    });

  app.put("/api/campaigns/:campaignId/tasks/:taskId", async (req, res) => {
    try {
      const sess = getSessionFromReq(req);
      if (!sess?.session) return res.status(401).json({ error: "not authenticated" });
      
      const { campaignId, taskId } = req.params;
      const task = await storage.getCampaignTask(taskId);
      if (!task) return res.status(404).json({ error: "task not found" });
      if (task.campaignId !== campaignId) return res.status(400).json({ error: "task does not belong to campaign" });
      
      // TODO: Validate project ownership/permissions
      
      await storage.updateCampaignTask(taskId, req.body);
      const updated = await storage.getCampaignTask(taskId);
      return res.json(updated);
    } catch (err) {
      console.error("[PUT /api/campaigns/:campaignId/tasks/:taskId]", err);
      return res.status(500).json({ error: "failed to update task" });
    }
  });

  app.delete("/api/campaigns/:campaignId/tasks/:taskId", async (req, res) => {
    try {
      const sess = getSessionFromReq(req);
      if (!sess?.session) return res.status(401).json({ error: "not authenticated" });
      
      const { campaignId, taskId } = req.params;
      const task = await storage.getCampaignTask(taskId);
      if (!task) return res.status(404).json({ error: "task not found" });
      if (task.campaignId !== campaignId) return res.status(400).json({ error: "task does not belong to campaign" });
      
      // TODO: Validate project ownership/permissions
      
      await storage.deleteCampaignTask(taskId);
      return res.json({ success: true });
    } catch (err) {
      console.error("[DELETE /api/campaigns/:campaignId/tasks/:taskId]", err);
      return res.status(500).json({ error: "failed to delete task" });
    }
  });

  app.get("/api/campaigns/:campaignId/tasks/completed/:userId", async (req, res) => {
    try {
      const { campaignId, userId } = req.params;
      const completedTaskIds = await storage.getUserCampaignTaskCompletions(userId, campaignId);
      return res.json({ taskIds: completedTaskIds });
    } catch (err) {
      console.error("[GET /api/campaigns/:campaignId/tasks/completed/:userId]", err);
      return res.status(500).json({ error: "failed to fetch completions" });
    }
  });

  app.post("/api/campaigns/:campaignId/tasks/:taskId/claim", async (req, res) => {
    try {
      const sess = getSessionFromReq(req);
      if (!sess?.session) return res.status(401).json({ error: "not authenticated" });
      
      const { campaignId, taskId } = req.params;
      const user = await storage.getUserByAddress(sess.session.address);
      if (!user) return res.status(404).json({ error: "user not found" });
      
      const task = await storage.getCampaignTask(taskId);
      if (!task) return res.status(404).json({ error: "task not found" });
      if (task.campaignId !== campaignId) return res.status(400).json({ error: "task does not belong to campaign" });
      
      const alreadyCompleted = await storage.isCampaignTaskCompleted(user.id, taskId);
      if (alreadyCompleted) return res.status(409).json({ error: "task already completed", code: "DUPLICATE_CAMPAIGN_TASK_COMPLETION" });
      
      // Record completion
      await storage.recordCampaignTaskCompletion(user.id, taskId, campaignId, task.xpReward || 0, req.body.verificationData);
      
      // Award XP
      const result = await storage.addXpToUser(user.id, task.xpReward || 0, { questsCompletedInc: 1 });
      
      return res.json({
        success: true,
        xpAwarded: task.xpReward || 0,
        newLevel: result.newLevel,
        newXp: result.xp,
      });
    } catch (err: any) {
      if (err.code === 'DUPLICATE_CAMPAIGN_TASK_COMPLETION') {
        return res.status(409).json({ error: "task already completed", code: err.code });
      }
      console.error("[POST /api/campaigns/:campaignId/tasks/:taskId/claim]", err);
      return res.status(500).json({ error: "failed to claim task" });
    }
  });

  return httpServer;
}
