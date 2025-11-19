import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertReferralEventSchema, insertReferralClaimSchema } from "@shared/schema";
import crypto from "crypto";
import { verifyMessage } from "ethers";

// In-memory stores for challenges and sessions. For production use a persistent store.
const challenges = new Map<string, { message: string; expiresAt: number; used?: boolean }>();
const sessions = new Map<string, { address: string; createdAt: number }>();

export async function registerRoutes(app: Express): Promise<Server> {
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

  // Dev helper: inspect persisted user profiles file
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

      const token = crypto.randomBytes(32).toString("hex");
      sessions.set(token, { address: String(address).toLowerCase(), createdAt: Date.now() });

      // set httpOnly cookie for session (also return token in body for backwards compatibility)
      const cookieName = process.env.SESSION_COOKIE_NAME || "nexura_sid";
      const isProd = process.env.NODE_ENV === "production";
      const cookieOpts: any = {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        secure: isProd,
      };

      res.cookie(cookieName, token, cookieOpts);

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

  // Dev helper: create a session for an address without signature verification.
  // This endpoint is meant for local development/testing only. It will be no-op in production.
  app.post("/__dev/login", async (req, res) => {
    try {
      if (process.env.NODE_ENV === "production") return res.status(404).json({ error: "not found" });
      const { address } = req.body || {};
      if (!address) return res.status(400).json({ error: "address required" });
      const addr = String(address).toLowerCase();

      const token = crypto.randomBytes(32).toString("hex");
      sessions.set(token, { address: addr, createdAt: Date.now() });

      // set httpOnly cookie for session
      const cookieName = process.env.SESSION_COOKIE_NAME || "nexura_sid";
      const isProd = process.env.NODE_ENV === "production";
      const cookieOpts: any = {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        secure: isProd,
      };
      res.cookie(cookieName, token, cookieOpts);

      // ensure a user record exists
      try {
        const existing = await storage.getUserByAddress(addr);
        if (!existing) {
          const randPwd = crypto.randomBytes(12).toString("hex");
          await storage.createUser({ username: addr, password: randPwd, address: addr } as any);
        }
      } catch (e) {
        console.warn("dev login: failed to ensure user record", e);
      }

      return res.json({ accessToken: token });
    } catch (e) {
      console.error("__dev/login error", e);
      return res.status(500).json({ error: "failed" });
    }
  });

  // --- Twitter (X) OAuth1.0a integration (request token -> authorize -> access token)
  const requestTokenSecrets = new Map<string, { secret: string; sessionToken?: string }>();

  function parseCookies(header: string) {
    return String(header || '').split(/;\s*/).reduce((acc: any, pair: string) => {
      const [k, v] = pair.split('='); if (k) acc[k] = v; return acc;
    }, {});
  }

  // helper to require an authenticated session cookie
  function getSessionFromReq(req: any) {
    const cookieHeader = String(req.headers.cookie || "");
    const cookieName = process.env.SESSION_COOKIE_NAME || "nexura_sid";
    const match = cookieHeader.split(/;\s*/).find((c: string) => c.startsWith(cookieName + "="));
    if (!match) return null;
    const token = match.split('=')[1];
    if (!token) return null;
    const s = sessions.get(token);
    return { token, session: s };
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
      const cookieHeader = String(req.headers.cookie || "");
      const cookieName = process.env.SESSION_COOKIE_NAME || "nexura_sid";

      // simple cookie parse
      const match = cookieHeader.split(/;\s*/).find((c) => c.startsWith(cookieName + "="));
      if (match) {
        const token = match.split('=')[1];
        if (token && sessions.has(token)) sessions.delete(token);
      }

      // clear cookie on client
      const isProd = process.env.NODE_ENV === "production";
      // Use same options as when setting the cookie so clearCookie matches correctly
      res.clearCookie(cookieName, { path: "/", httpOnly: true, sameSite: "lax", secure: isProd });
      return res.json({ success: true });
    } catch (err) {
      console.error("logout failed", err);
      return res.status(500).json({ error: "logout failed" });
    }
  });

  // Return profile for authenticated session (cookie-based)
  app.get("/profile", async (req, res) => {
    try {
      const cookieHeader = String(req.headers.cookie || "");
      const cookieName = process.env.SESSION_COOKIE_NAME || "nexura_sid";
      const match = cookieHeader.split(/;\s*/).find((c) => c.startsWith(cookieName + "="));
      if (!match) return res.status(401).json({ error: "not authenticated" });
      const token = match.split("=")[1];
      if (!token) return res.status(401).json({ error: "not authenticated" });
      const s = sessions.get(token);
      if (!s) return res.status(401).json({ error: "invalid session" });

      // Try to fetch user by address from storage
      const user = await storage.getUserByAddress(s.address);
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
      const cookieHeader = String(req.headers.cookie || "");
      const cookieName = process.env.SESSION_COOKIE_NAME || "nexura_sid";
      const match = cookieHeader.split(/;\s*/).find((c) => c.startsWith(cookieName + "="));
      if (!match) return res.status(401).json({ error: "not authenticated" });
      const token = match.split("=")[1];
      if (!token) return res.status(401).json({ error: "not authenticated" });
      const s = sessions.get(token);
      if (!s) return res.status(401).json({ error: "invalid session" });

      const user = await storage.getUserByAddress(s.address);
      if (!user) return res.json({ user: null, hasProfile: false, hasProject: false });
      const profile = await storage.getUserProfile(user.id);

      // check for projects owned by this wallet address or by user id
      let projects = [] as any[];
      try {
        const all = await storage.listProjects();
        const lower = String(s.address).toLowerCase();
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
  app.put("/api/users/profile", async (req, res) => {
    try {
      const cookieHeader = String(req.headers.cookie || "");
      const cookieName = process.env.SESSION_COOKIE_NAME || "nexura_sid";
      const match = cookieHeader.split(/;\s*/).find((c) => c.startsWith(cookieName + "="));
      if (!match) return res.status(401).json({ error: "not authenticated" });
      const token = match.split("=")[1];
      if (!token) return res.status(401).json({ error: "not authenticated" });
      const s = sessions.get(token);
      if (!s) return res.status(401).json({ error: "invalid session" });

      const user = await storage.getUserByAddress(s.address);
      if (!user) return res.status(404).json({ error: "user not found" });

      const { displayName, avatar, socialProfiles } = req.body || {};
      
      // Update user profile
      await storage.updateUserProfile(user.id, {
        displayName: displayName || user.username,
        avatar: avatar || user.avatar,
        socialProfiles: socialProfiles || {}
      });

      // Return updated user data
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
      // Get top users from user profiles
      const limit = parseInt(String(req.query.limit || '100'), 10);
      
      // Try to query from storage (works for both MemStorage and NeonStorage)
      try {
        // For NeonStorage, query directly
        if ((storage as any).query) {
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
            INNER JOIN user_profiles p ON u.id = p.user_id
            WHERE p.xp > 0
            ORDER BY p.xp DESC, p.level DESC
            LIMIT $1
          `, [limit]);
          return res.json(result.rows || []);
        }
        
        // For MemStorage, get all users and sort by XP
        const users = [] as any[];
        
        // Get all users with profiles and XP > 0
        for (const [userId, profile] of (storage as any).userProfiles.entries()) {
          if (!profile || (profile.xp || 0) <= 0) continue; // Skip users with no XP
          
          const user = await storage.getUser(userId);
          if (user && profile) {
            const displayName = profile.displayName || (user as any).displayName || user.username;
            users.push({
              id: user.id,
              username: user.username,
              address: (user as any).address || null,
              display_name: displayName,
              displayName: displayName,
              xp: profile.xp || 0,
              level: profile.level || 1,
              quests_completed: profile.questsCompleted || 0,
              tasks_completed: profile.tasksCompleted || 0,
            });
          }
        }
        
        // Sort by XP (descending), then by level (descending) as tiebreaker
        users.sort((a, b) => {
          const xpDiff = (b.xp || 0) - (a.xp || 0);
          if (xpDiff !== 0) return xpDiff;
          return (b.level || 1) - (a.level || 1);
        });
        return res.json(users.slice(0, limit));
        
      } catch (queryErr) {
        console.warn('Leaderboard query error:', queryErr);
        // Return empty array if query fails
        return res.json([]);
      }
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

  return httpServer;
}
